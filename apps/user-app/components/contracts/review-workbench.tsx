'use client';

import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useContract } from '@/lib/hooks/use-contract';
import { useContractVersions } from '@/lib/hooks/use-contract-versions';
import { useAuditLogs } from '@/lib/hooks/use-audit-logs';
import { useToast } from '@/lib/toast-context';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Textarea, Skeleton } from '@repo/ui';
import { TipTapEditor, type TipTapEditorRef } from '@/components/editor/tip-tap-editor';
import { VersionDiffView } from '@/components/contracts/version-diff-view';
import { cn } from '@repo/ui';
import type { Approval, Contract, ContractVersion, AuditLog } from '@repo/types';

type Tab = 'preview' | 'changes' | 'context' | 'audit';

type ApprovalWithContract = Approval & {
    contract?: (Partial<Contract> & { createdByUser?: { name?: string } }) | null;
};

interface ReviewWorkbenchProps {
    approval: ApprovalWithContract | null;
    canEdit: boolean;
    reviewerRole?: 'legal' | 'finance';
    onAction: () => void;
}

export function ReviewWorkbench({ approval, canEdit, reviewerRole = 'legal', onAction }: ReviewWorkbenchProps) {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    const contractId = approval?.contractId ?? approval?.contract?.id ?? '';
    const { data: contract, isLoading: contractLoading } = useContract(contractId);
    const { data: versions } = useContractVersions(contractId);
    const { data: auditLogs } = useAuditLogs(contractId);

    const [activeTab, setActiveTab] = useState<Tab>('preview');
    const [rejectComment, setRejectComment] = useState('');
    const [isActing, setIsActing] = useState(false);
    const [approvalComment, setApprovalComment] = useState('');
    const [showApproveDropdown, setShowApproveDropdown] = useState(false);

    const editorRef = useRef<TipTapEditorRef>(null);
    const [editedContent, setEditedContent] = useState<string | null>(null);

    type SerializedAuditLog = Omit<AuditLog, 'createdAt' | 'updatedAt'> & {
        createdAt: string;
        updatedAt?: string;
        description?: string;
        user?: { name?: string };
    };

    type ContractWithOrg = Contract & { organization?: { name?: string } };
    const c = contract as ContractWithOrg;
    const versionList = (versions as ContractVersion[]) ?? [];
    const logs = (auditLogs ?? []) as SerializedAuditLog[];

    const latestVersion = versionList.length > 0 ? versionList[0] : null;
    const previousVersion = versionList.length > 1 ? versionList[1] : null;

    const handleApprove = useCallback(async () => {
        if (!approval?.id) return;

        if (approvalComment.trim().length < 10) {
            showError('Comment Required', 'Please provide at least 10 characters justifying approval.');
            return;
        }

        setIsActing(true);
        try {
            await api.approvals.approve(approval.id, approvalComment.trim());
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
            success('Approved', 'Contract has been approved successfully.');
            setShowApproveDropdown(false);
            setApprovalComment('');
            onAction();
        } catch (err) {
            showError('Failed', err instanceof Error ? err.message : 'Could not approve');
        } finally {
            setIsActing(false);
        }
    }, [approval?.id, contractId, queryClient, success, showError, onAction, approvalComment]);

    const handleReject = useCallback(async () => {
        if (!approval?.id || !rejectComment.trim()) return;
        setIsActing(true);
        try {
            await api.approvals.reject(approval.id, rejectComment.trim());
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
            success('Changes Requested', 'Contract has been sent back for revision.');
            setRejectComment('');
            onAction();
        } catch (err) {
            showError('Failed', err instanceof Error ? err.message : 'Could not reject');
        } finally {
            setIsActing(false);
        }
    }, [approval?.id, rejectComment, contractId, queryClient, success, showError, onAction]);

    // Empty state
    if (!approval) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-neutral-50/50">
                <div className="size-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 border border-neutral-200">
                    <MaterialIcon name="pending_actions" size={32} className="text-neutral-400" />
                </div>
                <h3 className="text-neutral-900 font-semibold mb-1">No Selection</h3>
                <p className="text-sm text-neutral-500 max-w-xs">
                    Select a contract from the queue on the left to begin your review.
                </p>
            </div>
        );
    }

    // Loading state
    if (contractLoading) {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="px-6 py-4 border-b border-neutral-200">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="p-6 space-y-4">
                    <Skeleton className="h-96 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    const baseContent = c?.annexureData ?? c?.content ?? '';
    const editorContent = editedContent ?? baseContent;
    const totalValue = c?.amount ? `₹${Number(c.amount).toLocaleString('en-IN')}` : '—';

    const tabs: { key: Tab; label: string; icon: string; badge?: number }[] = [
        { key: 'preview', label: 'Preview', icon: 'visibility' },
        { key: 'changes', label: 'Changes', icon: 'difference', badge: previousVersion ? 3 : undefined },
        { key: 'context', label: 'Context', icon: 'info' },
        { key: 'audit', label: 'Audit Log', icon: 'history' },
    ];

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Document Header Bar */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-200 bg-white shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Org chip */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg border border-neutral-200">
                        <MaterialIcon name="domain" size={16} className="text-neutral-500" />
                        <span className="text-xs font-medium text-neutral-700 truncate max-w-[120px]">
                            {c?.organization?.name ?? 'Organization'}
                        </span>
                        <MaterialIcon name="expand_more" size={14} className="text-neutral-400" />
                    </div>

                    <div className="h-6 w-px bg-neutral-200" />

                    {/* Search within document */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search within document..."
                            aria-label="Search within document"
                            className="pl-3 pr-4 py-1.5 text-xs bg-transparent border-none text-neutral-500 placeholder:text-neutral-400 focus:outline-none w-48"
                            readOnly
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Total Value */}
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Total Value</p>
                        <p className="text-sm font-bold text-neutral-900">{totalValue}</p>
                    </div>

                    <div className="h-6 w-px bg-neutral-200" />

                    <button aria-label="Notifications" className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                        <MaterialIcon name="notifications" size={18} />
                    </button>
                    <button aria-label="Help" className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                        <MaterialIcon name="help" size={18} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 px-5 flex-shrink-0 bg-white">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all',
                            activeTab === tab.key
                                ? 'border-indigo-600 font-semibold text-indigo-700'
                                : 'border-transparent font-medium text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                        )}
                    >
                        <MaterialIcon
                            name={tab.icon}
                            size={18}
                            className={activeTab === tab.key ? 'text-indigo-600' : 'text-neutral-400'}
                        />
                        {tab.label}
                        {tab.badge !== undefined && (
                            <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-[10px] font-bold">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto relative">
                {/* Preview tab */}
                {activeTab === 'preview' && (
                    <div className="bg-neutral-100 min-h-full flex justify-center py-8 px-4">
                        <div className="bg-white max-w-[850px] w-full shadow-sm border border-neutral-200 rounded-sm p-12 relative">
                            {/* Page counter */}
                            <span className="absolute top-8 right-8 text-xs text-neutral-300 font-mono">
                                Page 1 of 14
                            </span>

                            <TipTapEditor
                                ref={editorRef}
                                content={editorContent}
                                onChange={(html) => setEditedContent(html)}
                                editable={canEdit}
                                placeholder="Contract content..."
                            />
                        </div>
                    </div>
                )}

                {/* Changes tab */}
                {activeTab === 'changes' && (
                    <div className="h-full">
                        {latestVersion && previousVersion ? (
                            <VersionDiffView
                                contractId={contractId}
                                fromVersion={{ id: previousVersion.id, versionNumber: String(previousVersion.versionNumber) }}
                                toVersion={{ id: latestVersion.id, versionNumber: String(latestVersion.versionNumber) }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="size-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                                    <MaterialIcon name="difference" size={24} className="text-neutral-400" />
                                </div>
                                <h3 className="text-neutral-900 font-medium">No comparison available</h3>
                                <p className="text-sm text-neutral-500 mt-1 max-w-xs">
                                    {versionList.length <= 1
                                        ? 'This is the first version.'
                                        : 'Could not load previous version data.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Context tab */}
                {activeTab === 'context' && (
                    <div className="max-w-2xl mx-auto p-6 space-y-6">
                        {/* Request Details */}
                        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
                                <MaterialIcon name="info" size={18} className="text-indigo-600" />
                                <h3 className="text-sm font-semibold text-neutral-900">Request Details</h3>
                            </div>
                            <div className="p-4 space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-neutral-500 mb-0.5">Requested By</p>
                                        <div className="flex items-center gap-2">
                                            <div className="size-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                                {approval.contract?.createdByUser?.name?.[0] || 'U'}
                                            </div>
                                            <span className="font-medium text-neutral-900">
                                                {approval.contract?.createdByUser?.name ?? 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-500 mb-0.5">Submitted On</p>
                                        <span className="text-neutral-900">
                                            {approval.createdAt
                                                ? new Date(approval.createdAt).toLocaleDateString(undefined, {
                                                      dateStyle: 'medium',
                                                  })
                                                : '—'}
                                        </span>
                                    </div>
                                </div>

                                {approval.comment && (
                                    <div className="pt-3 border-t border-neutral-100">
                                        <p className="text-xs text-neutral-500 mb-1">Submitter Note</p>
                                        <div className="bg-amber-50 rounded-lg p-3 text-neutral-700 italic border border-amber-100">
                                            &ldquo;{approval.comment}&rdquo;
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Audit Log tab */}
                {activeTab === 'audit' && (
                    <div className="max-w-2xl mx-auto p-6">
                        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
                                <MaterialIcon name="history" size={18} className="text-neutral-600" />
                                <h3 className="text-sm font-semibold text-neutral-900">Activity Log</h3>
                            </div>
                            <div className="p-4 max-h-[600px] overflow-y-auto">
                                {logs.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-neutral-400">No activity recorded yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-2.5 before:w-0.5 before:bg-neutral-100">
                                        {logs.map((log, i: number) => (
                                            <div key={log.id ?? i} className="relative pl-8">
                                                <div className="absolute left-0 top-1 size-5 rounded-full bg-white border-2 border-neutral-200 flex items-center justify-center text-neutral-400 z-10">
                                                    <div className="size-1.5 rounded-full bg-neutral-400" />
                                                </div>
                                                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                                                    <p className="text-sm text-neutral-900 font-medium">
                                                        {log.action ?? log.description ?? 'Activity logged'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                                                        <span>{log.user?.name ?? 'System'}</span>
                                                        <span>&middot;</span>
                                                        <span>
                                                            {log.createdAt
                                                                ? new Date(log.createdAt).toLocaleString()
                                                                : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Footer */}
            <div className="px-5 py-4 border-t border-neutral-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex-shrink-0">
                <div className="flex items-center justify-between">
                    {/* Left: Viewer avatar stack */}
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <div className="size-7 rounded-full bg-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                                Y
                            </div>
                            <div className="size-7 rounded-full bg-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                                A
                            </div>
                            <div className="size-7 rounded-full bg-amber-200 text-amber-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                                R
                            </div>
                            <button aria-label="2 more viewers" className="size-7 rounded-full bg-neutral-100 text-neutral-500 text-[10px] font-bold flex items-center justify-center ring-2 ring-white hover:bg-neutral-200 transition-colors">
                                +2
                            </button>
                        </div>
                        <span className="text-xs text-neutral-400">Viewing now</span>
                    </div>

                    {/* Right: Action buttons */}
                    <div className="flex items-center gap-3">
                        {reviewerRole === 'legal' ? (
                            <>
                                {/* Send Back with Notes */}
                                <button
                                    onClick={handleReject}
                                    disabled={isActing}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                                >
                                    <MaterialIcon name="edit_note" size={18} />
                                    Send Back with Notes
                                </button>

                                {/* Escalate */}
                                <button
                                    disabled={isActing}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                                >
                                    <MaterialIcon name="supervisor_account" size={18} />
                                    Escalate to Legal Head
                                </button>

                                {/* Approve with dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowApproveDropdown(!showApproveDropdown)}
                                        disabled={isActing}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
                                    >
                                        <MaterialIcon name="check_circle" size={18} />
                                        Approve
                                    </button>

                                    {showApproveDropdown && (
                                        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 p-4 z-30">
                                            <h4 className="text-sm font-bold text-neutral-900 mb-2">
                                                Confirm Approval
                                            </h4>
                                            <Textarea
                                                placeholder="State why this contract is compliant (min 10 chars)..."
                                                value={approvalComment}
                                                onChange={(e) => setApprovalComment(e.target.value)}
                                                rows={3}
                                                autoFocus
                                                className="mb-2"
                                            />
                                            <div className="flex items-center justify-between mb-3">
                                                <span
                                                    className={cn(
                                                        'text-[10px]',
                                                        approvalComment.length >= 10
                                                            ? 'text-emerald-600'
                                                            : 'text-neutral-400'
                                                    )}
                                                >
                                                    {approvalComment.length}/200
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => {
                                                        setShowApproveDropdown(false);
                                                        setApprovalComment('');
                                                    }}
                                                    className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={approvalComment.trim().length < 10 || isActing}
                                                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {isActing ? 'Confirming...' : 'Confirm'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Finance: Request Revision */}
                                <button
                                    onClick={handleReject}
                                    disabled={isActing}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                                >
                                    <MaterialIcon name="edit_note" size={18} />
                                    Request Revision
                                </button>

                                {/* Finance: Approve with dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowApproveDropdown(!showApproveDropdown)}
                                        disabled={isActing}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
                                    >
                                        <MaterialIcon name="check_circle" size={18} />
                                        Approve
                                    </button>

                                    {showApproveDropdown && (
                                        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 p-4 z-30">
                                            <h4 className="text-sm font-bold text-neutral-900 mb-2">
                                                Confirm Approval
                                            </h4>
                                            <Textarea
                                                placeholder="State why this contract is compliant (min 10 chars)..."
                                                value={approvalComment}
                                                onChange={(e) => setApprovalComment(e.target.value)}
                                                rows={3}
                                                autoFocus
                                                className="mb-2"
                                            />
                                            <div className="flex items-center justify-between mb-3">
                                                <span
                                                    className={cn(
                                                        'text-[10px]',
                                                        approvalComment.length >= 10
                                                            ? 'text-emerald-600'
                                                            : 'text-neutral-400'
                                                    )}
                                                >
                                                    {approvalComment.length}/200
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => {
                                                        setShowApproveDropdown(false);
                                                        setApprovalComment('');
                                                    }}
                                                    className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={approvalComment.trim().length < 10 || isActing}
                                                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {isActing ? 'Confirming...' : 'Confirm'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
