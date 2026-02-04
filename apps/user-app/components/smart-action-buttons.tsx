"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Spinner, Textarea } from "@repo/ui";
import {
    Edit, Send, Upload, CheckCircle, XCircle, ArrowRight, FileCheck, Clock, Loader2, Shield, Ban, AlertTriangle
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
        const stageMap: Record<string, string> = {
            DRAFT: 'Drafting & Review',
            REVISION_REQUESTED: 'Drafting & Review',
            IN_REVIEW: 'Internal Review',
            SENT_TO_LEGAL: 'Internal Review',
            SENT_TO_FINANCE: 'Internal Review',
            APPROVED: 'Ready for Execution',
            SENT_TO_COUNTERPARTY: 'External Review',
            ACTIVE: 'Active Contract',
            CANCELLED: 'Cancelled'
        };

        const label = stageMap[contract.status] || contract.status.replace(/_/g, ' ');

        return (
            <div className="flex flex-col gap-1 min-w-[150px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Stage</span>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${['ACTIVE'].includes(contract.status) ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`} />
                    <span className="text-sm font-bold text-slate-900">{label}</span>
                </div>
            </div>
        );
    };

    const ActionButton = ({ icon: Icon, label, subLabel, onClick, disabled, variant = 'outline', className }: any) => {
        // Shared Icon logic to ensure perfect alignment
        const IconWrapper = ({ children }: { children: React.ReactNode }) => (
            <div className={`
                flex items-center justify-center rounded-md w-7 h-7 sm:w-8 sm:h-8 transition-colors shrink-0
                ${variant === 'primary' ? 'bg-white/10 group-hover:bg-white/20' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-amber-600'}
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
                        relative overflow-hidden group bg-slate-900 hover:bg-black text-white 
                        border border-transparent rounded-lg pl-3 pr-4 py-2 sm:py-2.5 flex items-center gap-3 transition-all duration-300
                        shadow-md hover:shadow-xl hover:-translate-y-0.5 ring-offset-2 focus:ring-2 ring-indigo-500/30
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                        ${className}
                    `}
                >
                    <IconWrapper>
                        {loading ? <Spinner size="sm" className="text-white" /> : <Icon className="w-4 h-4 text-white" />}
                    </IconWrapper>
                    <div className="text-left hidden sm:block">
                        <div className="text-sm font-bold leading-none mb-1">{label}</div>
                        {subLabel && <div className="text-[10px] text-slate-300 font-medium leading-none opacity-80">{subLabel}</div>}
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
                    group relative bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 
                    text-slate-600 hover:text-slate-900 rounded-lg pl-3 pr-4 py-2 sm:py-2.5 flex items-center gap-2.5 transition-all duration-200
                    shadow-sm hover:shadow-md hover:-translate-y-0.5
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    ${className}
                `}
            >
                <div className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors">
                    <Icon className="w-full h-full" />
                </div>
                <span className="text-xs font-bold">{label}</span>
            </button>
        );
    };

    const GhostAction = ({ icon: Icon, label, onClick, variant = 'default' }: any) => (
        <button
            onClick={onClick}
            disabled={loading}
            className={`
                group flex items-center gap-1.5 text-xs font-bold transition-all px-3 py-2 rounded-lg
                ${variant === 'destructive'
                    ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}
            `}
        >
            <Icon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            {label}
        </button>
    );

    return (
        <>
            <div className="w-full bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500 sticky top-4 z-20">
                {/* Left: Status */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                    <StatusIndicator />
                </div>

                {/* Right: Actions Toolbar */}
                <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">


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
                        <>
                            {/* Allow adding missing reviewers (Parallel/Sequential option) */}
                            {permissions.canSubmit && (
                                <>
                                    {!['SENT_TO_FINANCE', 'FINANCE_REVIEW_IN_PROGRESS', 'FINANCE_REVIEWED'].includes(contract.status) && (
                                        <ActionButton
                                            icon={FileCheck}
                                            label="Send to Finance"
                                            onClick={() => onAction('submit', { target: 'FINANCE' })}
                                        />
                                    )}
                                    {!['SENT_TO_LEGAL', 'LEGAL_REVIEW_IN_PROGRESS', 'LEGAL_APPROVED'].includes(contract.status) && (
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
                            {permissions.canApproveFinance && ['IN_REVIEW', 'SENT_TO_FINANCE', 'FINANCE_REVIEW_IN_PROGRESS'].includes(contract.status) && (
                                <ActionButton
                                    icon={CheckCircle}
                                    label="Approve (Finance)"
                                    variant="primary"
                                    onClick={() => router.push(`/dashboard/approvals/finance?id=${contract.id}&action=approve`)}
                                />
                            )}

                            {/* Show Legal Approve ONLY if Sent to Legal OR Generic Review */}
                            {permissions.canApproveLegal && ['IN_REVIEW', 'SENT_TO_LEGAL', 'LEGAL_REVIEW_IN_PROGRESS'].includes(contract.status) && (
                                <ActionButton
                                    icon={CheckCircle}
                                    label="Approve (Legal)"
                                    variant="primary"
                                    onClick={() => router.push(`/dashboard/approvals/legal?id=${contract.id}&action=approve`)}
                                />
                            )}

                            {!permissions.canApproveFinance && !permissions.canApproveLegal && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 rounded-lg text-xs font-bold border border-amber-100 shadow-sm">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                                    Internal Review in Progress
                                </div>
                            )}
                        </>
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
        </>
    );
}
