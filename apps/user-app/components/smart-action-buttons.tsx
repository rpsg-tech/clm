"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
    Edit, Send, Upload, CheckCircle, XCircle, FileCheck, Shield, Ban, ArrowUpCircle, Loader2, History
} from "lucide-react";

// Hook
import { useSmartActions } from "../hooks/use-smart-actions";

// Components
import { StatusIndicator } from "./dashboard/contracts/actions/status-indicator";
import { ActionButton } from "./dashboard/contracts/actions/action-button";

// Dialogs
import { ApproveDialog } from "./dashboard/contracts/actions/dialogs/approve-dialog";
import { RejectDialog } from "./dashboard/contracts/actions/dialogs/reject-dialog";
import { RevisionDialog } from "./dashboard/contracts/actions/dialogs/revision-dialog";
import { EnhancedSendDialog, SendEmailPayload } from "./dashboard/contracts/actions/dialogs/send-dialog";

import { CancelDialog } from "./dashboard/contracts/actions/dialogs/cancel-dialog";

interface SmartActionButtonsProps {
    contract: any;
    permissions: {
        canEdit: boolean;
        canSubmit: boolean;
        canApproveLegal: boolean;
        canApproveFinance: boolean;
        canSend: boolean;
        canCancel: boolean;
    };
    loading: boolean;
    onAction: (action: string, payload?: any) => void;
    compact?: boolean;
    hideStatus?: boolean;
    hideSecondary?: boolean;
    location?: 'header' | 'sidebar';
}

export function SmartActionButtons({
    contract,
    permissions,
    loading,
    onAction,
    compact = false,
    hideStatus = false,
    hideSecondary = false,
    location = 'header'
}: SmartActionButtonsProps) {
    const router = useRouter();
    const { role } = useAuth(); // Pass role if needed for extra checks, but hook handles most

    const { flags, dialogs, actions: hookActions } = useSmartActions({
        contract,
        permissions,
        onAction
    });

    // --- SIDEBAR LAYOUT ---
    if (location === 'sidebar') {
        return (
            <div className="flex flex-col gap-4 w-full mb-6">
                <StatusIndicator status={contract.status} compact={false} />

                {/* Edit / Cancel Actions Stacked */}
                {['DRAFT', 'REVISION_REQUESTED', 'IN_REVIEW', 'SENT_TO_LEGAL', 'SENT_TO_FINANCE', 'PENDING_LEGAL_HEAD', 'SENT_TO_COUNTERPARTY', 'LEGAL_REVIEW_IN_PROGRESS', 'FINANCE_REVIEW_IN_PROGRESS'].includes(contract.status) && (
                    <div className="flex flex-col gap-2 w-full mt-2">
                        {flags.showEdit && (
                            <ActionButton
                                icon={Edit}
                                label="Edit Contract"
                                onClick={() => router.push(`/dashboard/contracts/${contract.id}/edit`)}
                                className="w-full justify-start"
                                compact={false}
                            />
                        )}

                        {flags.showCancel && (
                            <ActionButton
                                icon={Ban}
                                label="Cancel Contract"
                                onClick={hookActions.openCancelDialog}
                                className="w-full justify-start border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100 hover:border-red-300"
                                compact={false}
                            />
                        )}
                    </div>
                )}

                {/* Dialogs */}
                <CancelDialog
                    open={dialogs.showCancelDialog}
                    onOpenChange={dialogs.setShowCancelDialog}
                    onConfirm={hookActions.handleConfirmCancel}
                />
            </div>
        );
    }

    // --- HEADER LAYOUT (Default) ---
    return (
        <>
            <div className={`
                ${compact
                    ? 'flex items-center gap-4'
                    : 'w-full bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-md hover:shadow-lg transition-shadow sticky top-0 md:top-4 z-30'
                }
            `}>
                {/* Left: Status */}
                {!hideStatus && (
                    <div className={`flex items-center ${compact ? '' : 'w-full lg:w-auto justify-between lg:justify-start border-b lg:border-none border-slate-100 pb-3 lg:pb-0 gap-4'}`}>
                        <StatusIndicator status={contract.status} compact={compact} />
                    </div>
                )}

                {/* Right: Actions Toolbar */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ${compact ? 'ml-auto' : 'w-full lg:w-auto ml-auto'}`}>

                    {/* 1. SUBMISSION ACTIONS */}
                    {flags.showRequestFinance && (
                        <ActionButton
                            icon={FileCheck}
                            label="Request Finance Approval"
                            onClick={() => onAction('submit', { target: 'FINANCE' })}
                            loading={loading}
                            compact={compact}
                        />
                    )}

                    {flags.showSendToCounterparty && contract.status !== 'APPROVED' && (
                        <ActionButton
                            icon={Send}
                            label="Send to Counterparty"
                            onClick={hookActions.openSendToCounterpartyDialog}
                            loading={loading}
                            compact={compact}
                        />
                    )}

                    {flags.showSendToLegal && (
                        <ActionButton
                            icon={Shield}
                            label="Send to Legal"
                            variant="primary"
                            onClick={() => onAction('submit', { target: 'LEGAL' })}
                            loading={loading}
                            compact={compact}
                        />
                    )}

                    {/* 2. REVIEW ACTIONS */}
                    {flags.isReviewState && (
                        <>
                            {/* Finance Actions */}
                            {flags.showApproveFinance && (
                                <>
                                    <ActionButton
                                        icon={Edit}
                                        label="Request Changes"
                                        onClick={hookActions.openRevisionDialog}
                                        loading={loading}
                                        compact={compact}
                                    />
                                    <ActionButton
                                        icon={XCircle}
                                        label="Reject (Finance)"
                                        onClick={() => hookActions.openRejectDialog('FINANCE')}
                                        loading={loading}
                                        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300"
                                        compact={compact}
                                    />
                                    <ActionButton
                                        icon={CheckCircle}
                                        label="Approve (Finance)"
                                        variant="primary"
                                        onClick={() => hookActions.openApproveDialog('FINANCE')}
                                        loading={loading}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                        compact={compact}
                                    />
                                </>
                            )}

                            {/* Legal Actions */}
                            {flags.showApproveLegal && (
                                <>
                                    <ActionButton
                                        icon={Edit}
                                        label="Request Changes"
                                        onClick={hookActions.openRevisionDialog}
                                        loading={loading}
                                        compact={compact}
                                    />
                                    <ActionButton
                                        icon={XCircle}
                                        label={contract.status === 'PENDING_LEGAL_HEAD' ? "Reject (Legal Head)" : "Reject (Legal)"}
                                        onClick={() => hookActions.openRejectDialog('LEGAL')}
                                        loading={loading}
                                        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300"
                                        compact={compact}
                                    />
                                    {flags.showReturnToManager && (
                                        <ActionButton
                                            icon={Edit}
                                            label="Return to Manager"
                                            subLabel="Request Changes from Legal Team"
                                            onClick={() => hookActions.openRejectDialog('RETURN_TO_MANAGER')}
                                            loading={loading}
                                            className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300"
                                            compact={compact}
                                        />
                                    )}
                                    <ActionButton
                                        icon={CheckCircle}
                                        label={contract.status === 'PENDING_LEGAL_HEAD' ? "Approve (Legal Head)" : "Approve (Legal)"}
                                        variant="primary"
                                        onClick={() => hookActions.openApproveDialog('LEGAL')}
                                        loading={loading}
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                        compact={compact}
                                    />
                                    {flags.showEscalateToHead && (
                                        <ActionButton
                                            icon={ArrowUpCircle}
                                            label="Escalate to Legal Head"
                                            subLabel="Requires Head Approval"
                                            onClick={() => onAction('escalate_to_legal_head')}
                                            loading={loading}
                                            className="text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                                            compact={compact}
                                        />
                                    )}
                                </>
                            )}

                            {/* Pending State Indicators (if not approver) */}
                            {(flags.isLegalPending && !permissions.canApproveLegal) && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                    <span className="text-xs font-bold text-indigo-700">Waiting for Legal Review</span>
                                </div>
                            )}
                            {(flags.isFinancePending && !permissions.canApproveFinance) && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-100 rounded-lg">
                                    <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                                    <span className="text-xs font-bold text-cyan-700">Waiting for Finance Review</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* 3. APPROVED ACTIONS */}
                    {contract.status === 'APPROVED' && (
                        <>
                            {flags.showSendToCounterparty && (
                                <ActionButton
                                    icon={Send}
                                    label="Send to Counterparty"
                                    variant="primary"
                                    onClick={hookActions.openSendToCounterpartyDialog}
                                    loading={loading}
                                    className="bg-purple-600 hover:bg-purple-700"
                                    compact={compact}
                                />
                            )}

                            <ActionButton
                                icon={Upload}
                                label="Upload Contract"
                                onClick={() => onAction('open_upload_dialog')}
                                loading={loading}
                                compact={compact}
                            />
                        </>
                    )}

                    {/* 4. SENT TO COUNTERPARTY ACTIONS */}
                    {contract.status === 'SENT_TO_COUNTERPARTY' && (
                        <ActionButton
                            icon={Upload}
                            label="Upload Contract"
                            onClick={() => onAction('open_upload_dialog')}
                            loading={loading}
                            compact={compact}
                        />
                    )}

                    {/* 5. ACTIVE STATE */}
                    {/* 5. ACTIVE STATE */}
                    {contract.status === 'ACTIVE' && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <div className="text-xs font-bold text-emerald-800">Contract Active & Signed</div>
                            </div>

                            {/* Admin Revert Capability */}
                            {permissions.canEdit && ( // Using specific permission check in parent or here?
                                // We need access to auth context for specific permission check
                                <RevertButton onAction={onAction} loading={loading} />
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* --- Dialogs --- */}
            <ApproveDialog
                open={dialogs.showApproveDialog}
                onOpenChange={dialogs.setShowApproveDialog}
                onConfirm={hookActions.handleApprove}
                type={dialogs.activeApprovalType as 'LEGAL' | 'FINANCE' | null}
            />

            <RejectDialog
                open={dialogs.showRejectDialog}
                onOpenChange={dialogs.setShowRejectDialog}
                onConfirm={hookActions.handleReject}
                type={dialogs.activeApprovalType}
            />

            <RevisionDialog
                open={dialogs.showRevisionDialog}
                onOpenChange={dialogs.setShowRevisionDialog}
                onConfirm={hookActions.handleRequestRevision}
            />

            <EnhancedSendDialog
                open={dialogs.showSendDialog}
                onOpenChange={dialogs.setShowSendDialog}
                onConfirm={hookActions.handleSendToCounterparty}
                contract={contract}
                loading={loading}
            />


            <CancelDialog
                open={dialogs.showCancelDialog}
                onOpenChange={dialogs.setShowCancelDialog}
                onConfirm={hookActions.handleConfirmCancel}
            />
        </>
    );
}

function RevertButton({ onAction, loading }: { onAction: any, loading: boolean }) {
    const { hasPermission } = useAuth();

    if (!hasPermission('contract:revert')) return null;

    return (
        <ActionButton
            icon={History} // Ensure History is imported
            label="Revert Status"
            onClick={() => onAction('revert_status')}
            loading={loading}
            className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 ml-2"
            compact={false}
        />
    );
}
