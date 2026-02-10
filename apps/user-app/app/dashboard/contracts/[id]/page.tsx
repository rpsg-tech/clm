'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useContract } from '@/lib/hooks/use-contract';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { api } from '@/lib/api-client';
import { getStatusDisplay } from '@/lib/status-utils';
import { getContractActions } from '@/lib/contract-actions';
import { MaterialIcon } from '@/components/ui/material-icon';
import { CancelContractDialog } from '@/components/contracts/cancel-contract-dialog';
import { SendCounterpartyDialog } from '@/components/contracts/send-counterparty-dialog';
import { UploadSignedDialog } from '@/components/contracts/upload-signed-dialog';
import { ActivityTimeline } from '@/components/contracts/activity-timeline';
import { DocumentPreviewTab } from '@/components/contracts/document-preview-tab';
import { Skeleton, cn, Badge } from '@repo/ui';
import DOMPurify from 'isomorphic-dompurify';
import type { Contract } from '@repo/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

const VARIANT_STYLES = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20 border border-transparent',
    secondary: 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 shadow-sm',
    destructive: 'bg-white border border-error-light/30 text-error hover:bg-error-light/10',
} as const;

type ViewerTab = 'overview' | 'preview' | 'clauses' | 'financials';

function getWorkflowSteps(status: string) {
    const steps = [
        { id: 'legal', label: 'Legal Dept', icon: 'gavel' },
        { id: 'finance', label: 'Finance Dept', icon: 'account_balance' },
        { id: 'final', label: 'Final Approval', icon: 'check_circle' },
    ];

    const legalStatuses = ['DRAFT', 'SENT_TO_LEGAL', 'LEGAL_REVIEW_IN_PROGRESS', 'REVISION_REQUESTED'];
    const financeStatuses = ['LEGAL_APPROVED', 'SENT_TO_FINANCE', 'FINANCE_REVIEW_IN_PROGRESS'];
    const finalStatuses = ['FINANCE_REVIEWED', 'APPROVED'];
    const completedStatuses = ['EXECUTED', 'ACTIVE'];

    let legalStatus: 'pending' | 'in-progress' | 'completed' = 'pending';
    let financeStatus: 'pending' | 'in-progress' | 'completed' = 'pending';
    let finalStatus: 'pending' | 'in-progress' | 'completed' = 'pending';

    if (legalStatuses.includes(status)) {
        legalStatus = 'in-progress';
    } else if (financeStatuses.includes(status) || finalStatuses.includes(status) || completedStatuses.includes(status)) {
        legalStatus = 'completed';
    }

    if (financeStatuses.includes(status)) {
        financeStatus = 'in-progress';
    } else if (finalStatuses.includes(status) || completedStatuses.includes(status)) {
        financeStatus = 'completed';
    }

    if (finalStatuses.includes(status)) {
        finalStatus = 'in-progress';
    } else if (completedStatuses.includes(status)) {
        finalStatus = 'completed';
    }

    return [
        { ...steps[0], status: legalStatus },
        { ...steps[1], status: financeStatus },
        { ...steps[2], status: finalStatus },
    ];
}

export default function ContractDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const queryClient = useQueryClient();
    const { role } = useAuth();
    const { success, error: showError } = useToast();
    const { data: contract, isLoading } = useContract(id);
    const router = useRouter();

    // Smart Redirect: If user is legal/admin and contract is editable, go straight to editor
    useEffect(() => {
        if (!isLoading && contract && role) {
            const LEGAL_ROLES = ['LEGAL_HEAD', 'LEGAL_MANAGER', 'SUPER_ADMIN', 'ENTITY_ADMIN'];
            const isLegal = LEGAL_ROLES.includes(role);
            const targetContract = contract as Contract;
            const isEditable = targetContract.status === 'DRAFT' || targetContract.status === 'REVISION_REQUESTED';

            if (isLegal && isEditable) {
                router.replace(`/dashboard/contracts/${id}/edit`);
            }
        }
    }, [isLoading, contract, role, id, router]);

    const [showSendDialog, setShowSendDialog] = useState(false);
    const [showUploadSignedDialog, setShowUploadSignedDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [activeTab, setActiveTab] = useState<ViewerTab>('overview');

    type ContractDetail = Contract & {
        createdByUser?: { name?: string | null } | null;
        version?: string;
        template?: { name?: string | null } | null;
    };

    const c = (contract as ContractDetail | null) ?? null;

    async function handleSubmit(target: 'LEGAL' | 'FINANCE') {
        try {
            await api.contracts.submit(id, { target });
            queryClient.invalidateQueries({ queryKey: ['contract', id] });
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            success('Submitted', `Contract sent to ${target.toLowerCase()} for review.`);
        } catch (err) {
            showError('Submit Failed', err instanceof Error ? err.message : 'Could not submit contract');
        }
    }

    function handleAction(key: string) {
        switch (key) {
            case 'submit':
            case 'resubmit':
                handleSubmit('LEGAL');
                break;
            case 'send':
                setShowSendDialog(true);
                break;
            case 'upload-signed':
                setShowUploadSignedDialog(true);
                break;
            case 'cancel':
                setShowCancelDialog(true);
                break;
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
    }

    if (!c) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="size-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                    <MaterialIcon name="search_off" size={40} className="text-neutral-400" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Contract Not Found</h2>
                <p className="text-sm text-neutral-500 mb-6 max-w-xs mx-auto">The contract you are looking for may have been deleted or you don't have permission to view it.</p>
                <Link href="/dashboard/contracts">
                    <button className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                        Back to Contracts
                    </button>
                </Link>
            </div>
        );
    }

    const status = getStatusDisplay(c.status);
    const actions = getContractActions(c.status, role, id);
    const workflowSteps = getWorkflowSteps(c.status);

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm">
                <Link href="/dashboard/contracts" className="text-neutral-600 hover:text-primary-600 transition-colors">
                    Contracts
                </Link>
                <MaterialIcon name="chevron_right" size={16} className="text-neutral-400" />
                <span className="font-medium text-neutral-900">{c.reference || c.title}</span>
                <Badge
                    variant="default"
                    className={cn(
                        "ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset uppercase tracking-wide",
                        status.bg,
                        status.text,
                        status.ring
                    )}
                >
                    <MaterialIcon name={status.icon} size={12} />
                    {status.label}
                </Badge>
            </nav>

            {/* Header Area */}
            <div className="flex flex-col gap-4">
                {/* Title Row */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 leading-tight">
                                {c.title}
                            </h1>
                            {c.amount != null && (
                                <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-full ring-1 ring-emerald-600/20">
                                    ₹{Number(c.amount).toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                            <span className="flex items-center gap-1.5">
                                <MaterialIcon name="layers" size={16} />
                                Version {c.version || '1.0.0'}
                            </span>
                            <span className="text-neutral-300">|</span>
                            <span>
                                Last Updated {new Date(c.updatedAt || c.createdAt).toLocaleDateString()} by {c.createdByUser?.name || 'System'}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        {actions.map((action) =>
                            action.type === 'link' ? (
                                <Link
                                    key={action.key}
                                    href={action.href!}
                                    className={`inline-flex items-center gap-2 font-bold py-2.5 px-5 rounded-lg text-sm transition-all active:scale-95 ${VARIANT_STYLES[action.variant]}`}
                                >
                                    <MaterialIcon name={action.icon} size={18} />
                                    {action.label}
                                </Link>
                            ) : (
                                <button
                                    key={action.key}
                                    onClick={() => handleAction(action.key)}
                                    className={`inline-flex items-center gap-2 font-bold py-2.5 px-5 rounded-lg text-sm transition-all active:scale-95 ${VARIANT_STYLES[action.variant]}`}
                                >
                                    <MaterialIcon name={action.icon} size={18} />
                                    {action.label}
                                </button>
                            ),
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-neutral-200">
                <nav className="flex gap-8" aria-label="Tabs">
                    {[
                        { id: 'overview', label: 'Overview', icon: 'dashboard' },
                        { id: 'preview', label: 'Document Preview', icon: 'description' },
                        { id: 'clauses', label: 'Clauses', icon: 'gavel' },
                        { id: 'financials', label: 'Financials', icon: 'account_balance' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ViewerTab)}
                            className={cn(
                                "flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-all relative",
                                activeTab === tab.id
                                    ? "border-primary-600 text-primary-700"
                                    : "border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300"
                            )}
                        >
                            <MaterialIcon name={tab.icon} size={18} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Left Column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Activity Timeline */}
                            <ActivityTimeline contractId={id} />

                            {/* Contract Metadata */}
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-base font-bold text-neutral-900">Contract Metadata</h3>
                                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                        View All Fields
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Counterparty</p>
                                        <p className="text-sm font-semibold text-neutral-900">{c.counterpartyName || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Value</p>
                                        <p className="text-sm font-semibold text-neutral-900">
                                            {c.amount != null ? `₹${Number(c.amount).toLocaleString('en-IN')}` : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Currency</p>
                                        <p className="text-sm font-semibold text-neutral-900">INR (₹)</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Type</p>
                                        <p className="text-sm font-semibold text-neutral-900">{c.template?.name || 'Custom'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-neutral-200">
                                    <div className="col-span-2">
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Date Range</p>
                                        <p className="text-sm font-medium text-neutral-900">
                                            {c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} — {c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Region</p>
                                        <p className="text-sm font-medium text-neutral-900">India</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Regulatory Body</p>
                                        <p className="text-sm font-medium text-neutral-900">India (IRDAI)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (1/3) */}
                        <div className="space-y-6">
                            {/* Workflow Status */}
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                                <h3 className="text-base font-bold text-neutral-900 mb-6">Workflow Status</h3>
                                <div className="space-y-4">
                                    {workflowSteps.map((step, idx) => (
                                        <div key={step.id} className="flex items-start gap-4">
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={cn(
                                                        "size-10 rounded-full flex items-center justify-center ring-4 ring-white",
                                                        step.status === 'completed' && "bg-emerald-500",
                                                        step.status === 'in-progress' && "bg-amber-400 animate-pulse",
                                                        step.status === 'pending' && "bg-neutral-200"
                                                    )}
                                                >
                                                    {step.status === 'completed' ? (
                                                        <MaterialIcon name="check" size={20} className="text-white" />
                                                    ) : (
                                                        <MaterialIcon
                                                            name={step.icon}
                                                            size={20}
                                                            className={step.status === 'in-progress' ? 'text-white' : 'text-neutral-400'}
                                                        />
                                                    )}
                                                </div>
                                                {idx < workflowSteps.length - 1 && (
                                                    <div className={cn("w-0.5 h-8 mt-2", step.status === 'completed' ? 'bg-emerald-500' : 'bg-neutral-200')} />
                                                )}
                                            </div>
                                            <div className="flex-1 pt-2">
                                                <p className="text-sm font-bold text-neutral-900">{step.label}</p>
                                                <p className="text-xs text-neutral-500 mt-0.5">
                                                    {step.status === 'completed' && 'Approved'}
                                                    {step.status === 'in-progress' && 'In Progress'}
                                                    {step.status === 'pending' && 'Pending'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Document Preview Mini Card */}
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-neutral-900">Document Preview</h3>
                                    <button
                                        onClick={() => setActiveTab('preview')}
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        View Full Document
                                    </button>
                                </div>
                                {c.content ? (
                                    <div className="prose prose-sm max-w-none line-clamp-6 text-neutral-600">
                                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.content.substring(0, 200) + '...') }} />
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500">No document content available yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preview' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <DocumentPreviewTab contract={c} />
                    </div>
                )}

                {activeTab === 'clauses' && (
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden p-12 text-center text-neutral-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <MaterialIcon name="gavel" size={48} className="text-neutral-200 mb-4 mx-auto" />
                        <h3 className="text-lg font-medium text-neutral-900">Clause Extraction</h3>
                        <p className="text-sm mt-2">AI-powered clause extraction coming soon.</p>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden p-12 text-center text-neutral-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <MaterialIcon name="account_balance" size={48} className="text-neutral-200 mb-4 mx-auto" />
                        <h3 className="text-lg font-medium text-neutral-900">Financial Details</h3>
                        <p className="text-sm mt-2">Payment terms, milestones, and financial breakdown coming soon.</p>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <SendCounterpartyDialog
                isOpen={showSendDialog}
                onClose={() => setShowSendDialog(false)}
                contractId={id}
                counterpartyName={c.counterpartyName || null}
                counterpartyEmail={c.counterpartyEmail || null}
            />
            <UploadSignedDialog
                isOpen={showUploadSignedDialog}
                onClose={() => setShowUploadSignedDialog(false)}
                contractId={id}
            />
            <CancelContractDialog
                isOpen={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                contractId={id}
                contractTitle={c.title}
            />
        </div>
    );
}
