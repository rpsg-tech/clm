"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Spinner, Textarea } from "@repo/ui";
import {
    Edit, Send, Upload, CheckCircle, XCircle, ArrowRight, FileCheck, Clock, Loader2, Shield, Ban, AlertTriangle, ArrowUpCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

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

export function SmartActionButtons({ contract, permissions, loading, onAction, compact = false, hideStatus = false, hideSecondary = false, location = 'header' }: SmartActionButtonsProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isFeatureEnabled } = useAuth();

    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAction('upload_signed', file);
        }
    };

    const handleConfirmCancel = () => {
        onAction('cancel', { reason: cancelReason });
        setShowCancelDialog(false);
        setCancelReason("");
    };

    // Helper for Status Indicator
    const StatusIndicator = () => {
        // Color mapping for each status
        const statusColors: Record<string, string> = {
            DRAFT: 'bg-orange-500',
            REVISION_REQUESTED: 'bg-amber-500',
            IN_REVIEW: 'bg-blue-500',
            SENT_TO_LEGAL: 'bg-indigo-500',
            SENT_TO_FINANCE: 'bg-cyan-500',
            APPROVED: 'bg-green-500',
            SENT_TO_COUNTERPARTY: 'bg-purple-500',
            ACTIVE: 'bg-emerald-500',
            CANCELLED: 'bg-red-500',
            PENDING_LEGAL_HEAD: 'bg-indigo-600',
        };

        // Determine if status should pulse (active/in-progress states)
        const shouldPulse = !['ACTIVE', 'CANCELLED'].includes(contract.status);

        // Get color class, default to slate if status not mapped
        const colorClass = statusColors[contract.status] || 'bg-slate-400';

        // Format status for display (replace underscores with spaces, title case)
        const displayStatus = contract.status
            .split('_')
            .map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');

        return (
            <div className={`flex ${compact ? 'flex-row items-center gap-3' : 'flex-col gap-1.5'} min-w-[140px]`}>
                {!compact && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock size={10} />
                        Current Stage
                    </span>
                )}
                <div className={`
                    flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all duration-300
                    ${shouldPulse ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100'}
                    ${compact ? 'h-9 shadow-sm bg-white border-slate-200' : 'w-fit'}
                `}>
                    <div className={`relative flex items-center justify-center w-2.5 h-2.5`}>
                        <div className={`absolute w-full h-full rounded-full ${colorClass} ${shouldPulse ? 'animate-ping opacity-75' : ''}`} />
                        <div className={`relative w-2.5 h-2.5 rounded-full ${colorClass}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-800 tracking-tight">{displayStatus}</span>
                </div>
            </div>
        );
    };

    const ActionButton = ({ icon: Icon, label, subLabel, onClick, disabled, variant = 'outline', className }: any) => {
        // Shared Icon logic to ensure perfect alignment
        const isHeader = location === 'header';

        const IconWrapper = ({ children }: { children: React.ReactNode }) => (
            <div className={`
                flex items-center justify-center rounded-md transition-all duration-300 shrink-0
                ${isHeader ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'}
                ${variant === 'primary' ? 'bg-white/10 group-hover:bg-white/20' : 'bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:scale-110'}
            `}>
                {children}
            </div>
        );

        const buttonBaseClasses = `
            group relative flex items-center justify-center sm:justify-start gap-2.5 transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            w-full sm:w-auto rounded-xl
            ${isHeader ? 'px-3 py-2' : 'pl-3 pr-4 py-2.5'}
            ${className}
        `;

        if (variant === 'primary') {
            return (
                <button
                    onClick={onClick}
                    disabled={disabled}
                    className={`
                        ${buttonBaseClasses}
                        bg-slate-900 text-white border border-transparent
                        shadow-[0_2px_8px_0_rgba(15,23,42,0.30)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.23)] hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 active:scale-[0.98]
                        disabled:shadow-none
                    `}
                >
                    <IconWrapper>
                        {loading ? <Spinner size="sm" className="text-white" /> : <Icon className={`${isHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white`} />}
                    </IconWrapper>
                    <div className="text-left block relative z-10">
                        <div className={`font-bold leading-none tracking-wide ${isHeader ? 'text-[11px] mb-0.5' : 'text-xs mb-0.5'}`}>{label}</div>
                        {subLabel && <div className="text-[9px] text-slate-300 font-medium leading-none opacity-80">{subLabel}</div>}
                    </div>
                </button>
            );
        }

        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`
                    ${buttonBaseClasses}
                    bg-white border border-slate-200 text-slate-600
                    hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-700 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0
                `}
            >
                <div className={`
                    flex items-center justify-center rounded-md bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300 border border-slate-100 group-hover:border-orange-100
                    ${isHeader ? 'w-7 h-7' : 'w-8 h-8'}
                `}>
                    <Icon className={`${isHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                </div>
                <div className="text-left">
                    <div className={`font-bold leading-none tracking-wide ${isHeader ? 'text-[11px]' : 'text-xs'}`}>{label}</div>
                    {subLabel && <div className="text-[9px] text-slate-400 group-hover:text-orange-600/70 font-medium leading-none mt-0.5">{subLabel}</div>}
                </div>
            </button>
        );
    };


    const [showRevisionDialog, setShowRevisionDialog] = useState(false);
    const [revisionComment, setRevisionComment] = useState("");
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [approvalComment, setApprovalComment] = useState("");
    const [rejectComment, setRejectComment] = useState("");
    const [activeApprovalType, setActiveApprovalType] = useState<'LEGAL' | 'FINANCE' | null>(null);

    const handleRequestRevision = () => {
        // Identify which approval we are acting on
        const legalApproval = contract.approvals?.find((a: any) => a.type === 'LEGAL' && a.status === 'PENDING');
        const financeApproval = contract.approvals?.find((a: any) => a.type === 'FINANCE' && a.status === 'PENDING');

        let targetApprovalId;
        if (permissions.canApproveLegal && legalApproval) {
            targetApprovalId = legalApproval.id;
        } else if (permissions.canApproveFinance && financeApproval) {
            targetApprovalId = financeApproval.id;
        }

        if (targetApprovalId) {
            onAction('request_revision', { id: targetApprovalId, comment: revisionComment });
            setShowRevisionDialog(false);
            setRevisionComment("");
        } else {
            console.error('No pending approval found for user');
            // Optionally show error toast or disable button if logic allows
        }
    };

    const handleApprove = () => {
        if (activeApprovalType === 'LEGAL') {
            onAction('approve_legal', { comment: approvalComment });
        } else if (activeApprovalType === 'FINANCE') {
            onAction('approve_finance', { comment: approvalComment });
        }
        setShowApproveDialog(false);
        setApprovalComment("");
        setActiveApprovalType(null);
    };

    const handleReject = () => {
        if (activeApprovalType === 'LEGAL') {
            onAction('reject_legal', { comment: rejectComment });
        } else if (activeApprovalType === 'FINANCE') {
            onAction('reject_finance', { comment: rejectComment });
        }
        setShowRejectDialog(false);
        setRejectComment("");
        setActiveApprovalType(null);
    };

    // SIDEBAR LAYOUT
    if (location === 'sidebar') {
        return (
            <div className="flex flex-col gap-4 w-full mb-6">
                {/* Status Indicator */}
                <StatusIndicator />

                {/* Edit / Cancel Actions Stacked */}
                {['DRAFT', 'REVISION_REQUESTED', 'IN_REVIEW', 'SENT_TO_LEGAL', 'SENT_TO_FINANCE', 'PENDING_LEGAL_HEAD', 'SENT_TO_COUNTERPARTY', 'LEGAL_REVIEW_IN_PROGRESS', 'FINANCE_REVIEW_IN_PROGRESS'].includes(contract.status) && (
                    <div className="flex flex-col gap-2 w-full mt-2">
                        {permissions.canEdit && (
                            <ActionButton
                                icon={Edit}
                                label="Edit Contract"
                                onClick={() => router.push(`/dashboard/contracts/${contract.id}/edit`)}
                                className="w-full justify-start"
                            />
                        )}

                        {permissions.canCancel && (
                            <ActionButton
                                icon={Ban}
                                label="Cancel Contract"
                                onClick={() => setShowCancelDialog(true)}
                                className="w-full justify-start border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100 hover:border-red-300"
                            />
                        )}
                    </div>
                )}

                {/* Re-using Dialogs (keep them rendered) */}
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                                Cancel Contract
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to cancel this contract? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Textarea
                                placeholder="Reason for cancellation..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="resize-none"
                                rows={4}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                                Keep Contract
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmCancel}
                                disabled={!cancelReason.trim()}
                            >
                                Confirm Cancellation
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // HEADER LAYOUT (Default)
    return (
        <>
            <div className={`
                ${compact
                    ? 'flex items-center gap-4'
                    : 'w-full bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-md hover:shadow-lg transition-shadow sticky top-0 md:top-4 z-30'
                }
            `}>
                {/* Left: Status - HIDDEN in Compact/Header Mode by default via props, but ensuring cleanup */}
                {!hideStatus && (
                    <div className={`flex items-center ${compact ? '' : 'w-full lg:w-auto justify-between lg:justify-start border-b lg:border-none border-slate-100 pb-3 lg:pb-0 gap-4'}`}>
                        <StatusIndicator />
                    </div>
                )}

                {/* Right: Actions Toolbar */}
                <div className={`flex items-center gap-2 flex-wrap ${compact ? '' : 'justify-end w-full lg:w-auto'}`}>

                    {/* START APPROVAL ACTIONS (Parallel/Sequential Workflows) */}
                    {(() => {
                        // Terminal states where starting new workflows doesn't make sense
                        const isTerminal = ['APPROVED', 'ACTIVE', 'CANCELLED', 'REJECTED', 'PENDING_LEGAL_HEAD'].includes(contract.status);

                        // Check existing approvals
                        const hasLegalApproval = contract.approvals?.some((a: any) => a.type === 'LEGAL');
                        const hasFinanceApproval = contract.approvals?.some((a: any) => a.type === 'FINANCE');

                        const showSendToLegal = permissions.canSubmit && !hasLegalApproval && !isTerminal;
                        const showRequestFinance = permissions.canSubmit && !hasFinanceApproval && !isTerminal;
                        const showSendToCounterparty = (contract.status === 'DRAFT' || contract.status === 'REVISION_REQUESTED') && permissions.canSend;

                        if (!showSendToLegal && !showRequestFinance && !showSendToCounterparty) return null;

                        return (
                            <>
                                {showRequestFinance && (
                                    <ActionButton
                                        icon={FileCheck}
                                        label="Request Finance Approval"
                                        onClick={() => onAction('submit', { target: 'FINANCE' })}
                                    />
                                )}

                                {showSendToCounterparty && (
                                    <ActionButton
                                        icon={Send}
                                        label="Send to Counterparty"
                                        onClick={() => onAction('send')}
                                    />
                                )}

                                {showSendToLegal && (
                                    <ActionButton
                                        icon={Shield}
                                        label="Send to Legal"
                                        variant="primary"
                                        onClick={() => onAction('submit', { target: 'LEGAL' })}
                                    />
                                )}
                            </>
                        );
                    })()}

                    {/* REVIEW ACTIONS - Strict Context Visibility */}
                    {['IN_REVIEW', 'SENT_TO_LEGAL', 'SENT_TO_FINANCE', 'LEGAL_REVIEW_IN_PROGRESS', 'FINANCE_REVIEW_IN_PROGRESS', 'PENDING_LEGAL_HEAD'].includes(contract.status) && (
                        (() => {
                            // Check existence of specific approvals
                            const legalApproval = contract.approvals?.find((a: any) => a.type === 'LEGAL');
                            const financeApproval = contract.approvals?.find((a: any) => a.type === 'FINANCE');

                            const isLegalPending = legalApproval?.status === 'PENDING';
                            const isFinancePending = financeApproval?.status === 'PENDING';
                            const isLegalApproved = legalApproval?.status === 'APPROVED';
                            const isFinanceApproved = financeApproval?.status === 'APPROVED';

                            // If USER has permission AND approval is pending
                            const showLegalAction = permissions.canApproveLegal && isLegalPending;
                            const showFinanceAction = permissions.canApproveFinance && isFinancePending;

                            return (
                                <>
                                    {/* FINANCE ACTIONS */}
                                    {showFinanceAction && (
                                        <div className="flex gap-2">
                                            <ActionButton
                                                icon={Edit}
                                                label="Request Changes"
                                                onClick={() => {
                                                    setShowRevisionDialog(true);
                                                }}
                                            />
                                            <ActionButton
                                                icon={XCircle}
                                                label="Reject (Finance)"
                                                onClick={() => {
                                                    setActiveApprovalType('FINANCE');
                                                    setShowRejectDialog(true);
                                                }}
                                                className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300"
                                            />
                                            <ActionButton
                                                icon={CheckCircle}
                                                label="Approve (Finance)"
                                                variant="primary"
                                                onClick={() => {
                                                    setActiveApprovalType('FINANCE');
                                                    setShowApproveDialog(true);
                                                }}
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                            />
                                        </div>
                                    )}

                                    {/* LEGAL ACTIONS */}
                                    {showLegalAction && (
                                        <div className="flex gap-2">
                                            <ActionButton
                                                icon={Edit}
                                                label="Request Changes"
                                                onClick={() => {
                                                    setShowRevisionDialog(true);
                                                }}
                                            />
                                            <ActionButton
                                                icon={XCircle}
                                                label={contract.status === 'PENDING_LEGAL_HEAD' ? "Reject (Legal Head)" : "Reject (Legal)"}
                                                onClick={() => {
                                                    setActiveApprovalType('LEGAL');
                                                    setShowRejectDialog(true);
                                                }}
                                                className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300"
                                            />
                                            <ActionButton
                                                icon={CheckCircle}
                                                label={contract.status === 'PENDING_LEGAL_HEAD' ? "Approve (Legal Head)" : "Approve (Legal)"}
                                                variant="primary"
                                                onClick={() => {
                                                    setActiveApprovalType('LEGAL');
                                                    setShowApproveDialog(true);
                                                }}
                                                className="bg-indigo-600 hover:bg-indigo-700"
                                            />
                                            {(contract.status !== 'PENDING_LEGAL_HEAD' && contract.status !== 'LEGAL_REVIEW_IN_PROGRESS') && (
                                                <ActionButton
                                                    icon={ArrowUpCircle}
                                                    label="Escalate to Legal Head"
                                                    subLabel="Requires Head Approval"
                                                    onClick={() => onAction('escalate_to_legal_head')}
                                                    className="text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* If pending but user is NOT the approver, show status */}
                                    {(isLegalPending && !permissions.canApproveLegal) && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                                            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                            <span className="text-xs font-bold text-indigo-700">Waiting for Legal Review</span>
                                        </div>
                                    )}
                                    {(isFinancePending && !permissions.canApproveFinance) && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-100 rounded-lg">
                                            <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                                            <span className="text-xs font-bold text-cyan-700">Waiting for Finance Review</span>
                                        </div>
                                    )}
                                </>
                            );
                        })()
                    )}

                    {/* APPROVED ACTIONS - Post-Approval Workflow */}
                    {contract.status === 'APPROVED' && (
                        <>
                            <div className="hidden">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".pdf,.docx"
                                    className="hidden"
                                />
                            </div>

                            {permissions.canSend && (
                                <ActionButton
                                    icon={Send}
                                    label="Send to Counterparty"
                                    variant="primary"
                                    onClick={() => onAction('send')}
                                    className="bg-purple-600 hover:bg-purple-700"
                                />
                            )}

                            <ActionButton
                                icon={Upload}
                                label="Upload Signed Copy"
                                subLabel="Skip sending"
                                onClick={() => fileInputRef.current?.click()}
                            />
                        </>
                    )}

                    {/* NEGOTIATION ACTIONS */}
                    {contract.status === 'SENT_TO_COUNTERPARTY' && (
                        <>
                            <div className="hidden">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".pdf,.docx"
                                    className="hidden"
                                />
                            </div>
                            <ActionButton
                                icon={Upload}
                                label="Upload Signed Copy"
                                subLabel="If received offline"
                                onClick={() => fileInputRef.current?.click()}
                            />
                        </>
                    )}

                    {/* ACTIVE STATE */}
                    {contract.status === 'ACTIVE' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <div className="text-xs font-bold text-emerald-800">Contract Active & Signed</div>
                        </div>
                    )}

                </div>
            </div>

            {/* Cancel Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Ban className="w-5 h-5" />
                            Cancel Contract
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this contract? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder="Reason for cancellation (required)..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                            Keep Contract
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmCancel}
                            disabled={!cancelReason.trim()}
                        >
                            Confirm Cancellation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revision Dialog */}
            <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <Edit className="w-5 h-5" />
                            Request Changes
                        </DialogTitle>
                        <DialogDescription>
                            Specify the changes required. The contract will be returned to Draft state for the creator to edit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder="Describe the changes needed..."
                            value={revisionComment}
                            onChange={(e) => setRevisionComment(e.target.value)}
                            className="resize-none"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRequestRevision}
                            disabled={!revisionComment.trim()}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            Request Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            Approve Contract ({activeApprovalType})
                        </DialogTitle>
                        <DialogDescription>
                            Approve this contract for {activeApprovalType === 'LEGAL' ? 'legal compliance' : 'financial review'}. You may add optional comments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder="Add approval notes (optional)..."
                            value={approvalComment}
                            onChange={(e) => setApprovalComment(e.target.value)}
                            className="resize-none"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm Approval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-5 h-5" />
                            Reject Contract ({activeApprovalType})
                        </DialogTitle>
                        <DialogDescription>
                            Reject this contract and explain the reason. The contract creator will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder="Reason for rejection (required)..."
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            className="resize-none"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={!rejectComment.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
