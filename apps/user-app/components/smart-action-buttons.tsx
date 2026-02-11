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
    };
    loading: boolean;
    onAction: (action: string, payload?: any) => void;
}

export function SmartActionButtons({ contract, permissions, loading, onAction }: SmartActionButtonsProps) {
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
            <div className="flex flex-col gap-1.5 min-w-[160px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Stage</span>
                <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${colorClass} ${shouldPulse ? 'animate-pulse' : ''}`} />
                    <span className="text-sm font-bold text-slate-900">{displayStatus}</span>
                </div>
            </div>
        );
    };

    const ActionButton = ({ icon: Icon, label, subLabel, onClick, disabled, variant = 'outline', className }: any) => {
        // Shared Icon logic to ensure perfect alignment
        const IconWrapper = ({ children }: { children: React.ReactNode }) => (
            <div className={`
                flex items-center justify-center rounded-md w-7 h-7 sm:w-8 sm:h-8 transition-colors shrink-0
                ${variant === 'primary' ? 'bg-white/10 group-hover:bg-white/20' : 'bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600'}
            `}>
                {children}
            </div>
        );

        if (variant === 'primary') {
            return (
                <button
                    onClick={onClick}
                    disabled={disabled}
                    className={`
                        relative overflow-hidden group bg-slate-900 hover:bg-orange-600 text-white 
                        border border-transparent rounded-lg pl-3 pr-3 py-2 flex items-center justify-center sm:justify-start gap-2.5 transition-all duration-300
                        shadow-md shadow-slate-900/20 hover:shadow-lg hover:shadow-orange-500/30 ring-offset-2 focus:ring-2 ring-orange-500/30
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                        w-full sm:w-auto
                        ${className}
                    `}
                >
                    <IconWrapper>
                        {loading ? <Spinner size="sm" className="text-white" /> : <Icon className="w-4 h-4 text-white" />}
                    </IconWrapper>
                    <div className="text-left block">
                        <div className="text-xs font-bold leading-none mb-1">{label}</div>
                        {subLabel && <div className="text-[9px] text-slate-300 font-medium leading-none opacity-80">{subLabel}</div>}
                    </div>
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10 pointer-events-none" />
                </button>
            );
        }

        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`
                    group relative bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 
                    text-slate-600 hover:text-orange-600 rounded-lg pl-3 pr-3 py-2 flex items-center justify-center sm:justify-start gap-2.5 transition-all duration-200
                    shadow-sm hover:shadow-md
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    w-full sm:w-auto
                    ${className}
                `}
            >
                <div className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors">
                    <Icon className="w-full h-full" />
                </div>
                <span className="text-[11px] font-bold">{label}</span>
            </button>
        );
    };

    const GhostAction = ({ icon: Icon, label, onClick, variant = 'default' }: any) => (
        <button
            onClick={onClick}
            disabled={loading}
            className={`
                group flex items-center gap-1.5 text-[10px] font-bold transition-all px-3 py-1.5 rounded-lg border border-transparent
                ${variant === 'destructive'
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100'
                    : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-100'}
            `}
        >
            <Icon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            {label}
        </button>
    );

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

    return (
        <>
            <div className="w-full bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-md hover:shadow-lg transition-shadow sticky top-0 md:top-4 z-30">
                {/* Left: Status */}
                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start border-b lg:border-none border-slate-100 pb-3 lg:pb-0">
                    <StatusIndicator />
                </div>

                {/* Right: Actions Toolbar */}
                <div className="flex items-center gap-2 flex-wrap justify-end w-full lg:w-auto">


                    {/* Secondary Actions (Appears in Draft & Review now) */}
                    {(['DRAFT', 'REVISION_REQUESTED', 'IN_REVIEW', 'SENT_TO_LEGAL', 'SENT_TO_FINANCE'].includes(contract.status)) && (
                        <>
                            {permissions.canEdit && (
                                <GhostAction
                                    icon={Edit}
                                    label="Edit Contract"
                                    onClick={() => router.push(`/dashboard/contracts/${contract.id}/edit`)}
                                />
                            )}

                            <GhostAction
                                icon={Ban}
                                label="Cancel"
                                variant="destructive"
                                onClick={() => setShowCancelDialog(true)}
                            />
                        </>
                    )}

                    {/* Divider */}
                    {(['DRAFT', 'REVISION_REQUESTED', 'IN_REVIEW', 'SENT_TO_LEGAL', 'SENT_TO_FINANCE'].includes(contract.status)) && (
                        <div className="hidden md:block w-px h-8 bg-slate-200 mx-2" />
                    )}

                    {/* DRAFT ACTIONS */}
                    {(contract.status === 'DRAFT' || contract.status === 'REVISION_REQUESTED') && permissions.canSubmit && (
                        <>
                            <ActionButton
                                icon={FileCheck}
                                label="Send to Finance"
                                onClick={() => onAction('submit', { target: 'FINANCE' })}
                            />

                            {permissions.canSend && (
                                <ActionButton
                                    icon={Send}
                                    label="Send to Counterparty"
                                    onClick={() => onAction('send')}
                                />
                            )}

                            <ActionButton
                                icon={Shield}
                                label="Send to Legal"
                                subLabel="Recommended"
                                variant="primary"
                                onClick={() => onAction('submit', { target: 'LEGAL' })}
                            />
                        </>
                    )}

                    {/* REVIEW ACTIONS - Strict Context Visibility */}
                    {['IN_REVIEW', 'SENT_TO_LEGAL', 'SENT_TO_FINANCE', 'LEGAL_REVIEW_IN_PROGRESS', 'FINANCE_REVIEW_IN_PROGRESS'].includes(contract.status) && (
                        (() => {
                            // Check existence of specific approvals
                            const legalApproval = contract.approvals?.find((a: any) => a.type === 'LEGAL');
                            const financeApproval = contract.approvals?.find((a: any) => a.type === 'FINANCE');

                            const isLegalPending = legalApproval?.status === 'PENDING';
                            const isFinancePending = financeApproval?.status === 'PENDING';
                            const isLegalApproved = legalApproval?.status === 'APPROVED';
                            const isFinanceApproved = financeApproval?.status === 'APPROVED';
                            const canAct = (permissions.canApproveLegal && isLegalPending) || (permissions.canApproveFinance && isFinancePending);


                            return (
                                <>
                                    {/* Request Changes (Available to any active approver) */}
                                    {canAct && (
                                        <ActionButton
                                            icon={FileCheck} // Or a specific icon for changes
                                            label="Request Changes"
                                            onClick={() => setShowRevisionDialog(true)}
                                            className="text-amber-600 hover:bg-amber-50 hover:border-amber-200"
                                        />
                                    )}

                                    {/* Allow adding missing reviewers (Parallel/Sequential option) */}
                                    {permissions.canSubmit && (
                                        <>
                                            {!financeApproval && !isFinanceApproved && (
                                                <ActionButton
                                                    icon={FileCheck}
                                                    label="Send to Finance"
                                                    onClick={() => onAction('submit', { target: 'FINANCE' })}
                                                />
                                            )}
                                            {!legalApproval && !isLegalApproved && (
                                                <ActionButton
                                                    icon={Shield}
                                                    label="Send to Legal"
                                                    subLabel="Add Reviewer"
                                                    variant="primary"
                                                    onClick={() => onAction('submit', { target: 'LEGAL' })}
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* Show Finance Approve ONLY if Sent to Finance OR Generic Review */}
                                    {permissions.canApproveFinance && isFinancePending && (
                                        <>
                                            <ActionButton
                                                icon={CheckCircle}
                                                label="Approve (Finance)"
                                                variant="primary"
                                                onClick={() => {
                                                    setActiveApprovalType('FINANCE');
                                                    setShowApproveDialog(true);
                                                }}
                                            />
                                            <ActionButton
                                                icon={XCircle}
                                                label="Reject"
                                                className="text-red-500 hover:bg-red-50 hover:border-red-200"
                                                onClick={() => {
                                                    setActiveApprovalType('FINANCE');
                                                    setShowRejectDialog(true);
                                                }}
                                            />
                                        </>
                                    )}

                                    {/* Show Legal Approve ONLY if Sent to Legal OR Generic Review */}
                                    {permissions.canApproveLegal && isLegalPending && (
                                        <>
                                            <ActionButton
                                                icon={CheckCircle}
                                                label="Approve (Legal)"
                                                variant="primary"
                                                onClick={() => {
                                                    setActiveApprovalType('LEGAL');
                                                    setShowApproveDialog(true);
                                                }}
                                            />
                                            <ActionButton
                                                icon={XCircle}
                                                label="Reject"
                                                className="text-red-500 hover:bg-red-50 hover:border-red-200"
                                                onClick={() => {
                                                    setActiveApprovalType('LEGAL');
                                                    setShowRejectDialog(true);
                                                }}
                                            />

                                            {/* Escalate to Legal Head - only for Legal Managers */}
                                            {(['SENT_TO_LEGAL', 'LEGAL_REVIEW_IN_PROGRESS'].includes(contract.status)) && (
                                                <ActionButton
                                                    icon={ArrowUpCircle}
                                                    label="Escalate to Legal Head"
                                                    subLabel="Requires Head Approval"
                                                    className="text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                                                    onClick={() => onAction('escalate_to_legal_head')}
                                                />
                                            )}
                                        </>
                                    )}

                                    {!permissions.canApproveFinance && !permissions.canApproveLegal && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 rounded-lg text-xs font-bold border border-amber-100 shadow-sm">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                                            Internal Review in Progress
                                        </div>
                                    )}
                                </>
                            );
                        })()
                    )}

                    {/* APPROVED ACTIONS */}
                    {(contract.status === 'APPROVED' || contract.status === 'LEGAL_APPROVED' || contract.status === 'FINANCE_REVIEWED') && (
                        <>
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-100 shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                Approved Internally
                            </div>
                            {permissions.canSend && contract.status === 'APPROVED' && (
                                <ActionButton
                                    icon={Send}
                                    label="Send to Counterparty"
                                    subLabel="Ready for execution"
                                    variant="primary"
                                    onClick={() => onAction('send')}
                                />
                            )}
                        </>
                    )}

                    {/* SENT ACTIONS */}
                    {contract.status === 'SENT_TO_COUNTERPARTY' && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="application/pdf"
                                onChange={handleFileUpload}
                            />
                            <ActionButton
                                icon={Upload}
                                label="Upload Signed Copy"
                                subLabel="Finalize Contract"
                                variant="primary"
                                onClick={() => fileInputRef.current?.click()}
                            />
                        </>
                    )}

                    {/* ACTIVE ACTIONS */}
                    {contract.status === 'ACTIVE' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-200 shadow-sm">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                            Active Contract
                        </div>
                    )}

                    {/* CANCELLED ACTIONS */}
                    {contract.status === 'CANCELLED' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold border border-slate-200">
                            <Ban className="w-3.5 h-3.5" />
                            Cancelled
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Dialog */}
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
                            placeholder="Please provide a reason for cancellation..."
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
