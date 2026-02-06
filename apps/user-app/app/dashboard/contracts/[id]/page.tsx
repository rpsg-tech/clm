'use client';

import { use, useState } from 'react';
import Link from 'next/link';
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
import { Skeleton } from '@repo/ui';

interface PageProps {
    params: Promise<{ id: string }>;
}

const VARIANT_STYLES = {
    primary: 'bg-indigo-700 hover:bg-indigo-800 text-white',
    secondary: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
    destructive: 'bg-white border border-red-200 text-red-600 hover:bg-red-50',
} as const;

export default function ContractDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const queryClient = useQueryClient();
    const { role } = useAuth();
    const { success, error: showError } = useToast();
    const { data: contract, isLoading } = useContract(id);

    const [showSendDialog, setShowSendDialog] = useState(false);
    const [showUploadSignedDialog, setShowUploadSignedDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    const c = contract as any;

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
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    if (!c) {
        return (
            <div className="text-center py-16">
                <MaterialIcon name="error_outline" size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Contract not found.</p>
                <Link href="/dashboard/contracts" className="text-sm text-primary-700 font-medium mt-2 inline-block">
                    Back to Contracts
                </Link>
            </div>
        );
    }

    const status = getStatusDisplay(c.status);
    const actions = getContractActions(c.status, role, id);

    return (
        <div className="space-y-6">
            {/* Back + header */}
            <div>
                <Link
                    href="/dashboard/contracts"
                    className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800 font-medium mb-4"
                >
                    <MaterialIcon name="arrow_back" size={16} />
                    Back to Contracts
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {c.title}
                            </h1>
                            <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.bg} ${status.text} ${status.ring}`}
                            >
                                <MaterialIcon name={status.icon} size={14} />
                                {status.label}
                            </span>
                        </div>
                        {c.reference && (
                            <p className="text-sm text-slate-500 font-mono">{c.reference}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {actions.map((action) =>
                            action.type === 'link' ? (
                                <Link
                                    key={action.key}
                                    href={action.href!}
                                    className={`inline-flex items-center gap-1.5 font-medium py-2 px-4 rounded-lg text-sm transition-colors ${VARIANT_STYLES[action.variant]}`}
                                >
                                    <MaterialIcon name={action.icon} size={16} />
                                    {action.label}
                                </Link>
                            ) : (
                                <button
                                    key={action.key}
                                    onClick={() => handleAction(action.key)}
                                    className={`inline-flex items-center gap-1.5 font-medium py-2 px-4 rounded-lg text-sm transition-colors ${VARIANT_STYLES[action.variant]}`}
                                >
                                    <MaterialIcon name={action.icon} size={16} />
                                    {action.label}
                                </button>
                            ),
                        )}
                    </div>
                </div>
            </div>

            {/* Details card */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-900">Contract Details</h2>
                </div>
                <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Counterparty</p>
                        <p className="text-sm text-slate-900">{c.counterpartyName || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email</p>
                        <p className="text-sm text-slate-900">{c.counterpartyEmail || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Template</p>
                        <p className="text-sm text-slate-900">{c.template?.name || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Start Date</p>
                        <p className="text-sm text-slate-900">
                            {c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Expiry Date</p>
                        <p className="text-sm text-slate-900">
                            {c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Value</p>
                        <p className="text-sm text-slate-900">
                            {c.amount != null ? `₹${Number(c.amount).toLocaleString('en-IN')}` : '—'}
                        </p>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-sm text-slate-900">{c.description || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Created By</p>
                        <p className="text-sm text-slate-900">{c.createdByUser?.name || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Created At</p>
                        <p className="text-sm text-slate-900">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                        </p>
                    </div>
                </div>
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
