'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Spinner, Skeleton } from '@repo/ui';
import { SafeHtml } from '@/components/SafeHtml';
import { useAuth, usePermission } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { api } from '@/lib/api-client';
import {
    ArrowLeft,
    FileText,
    Clock,
    FileSignature,
    Download,
    History,
    ChevronRight,
    Wand2,
    Sparkles,
    Calendar,
    User,
    Mail,
    Eye,
    X,
    FileCheck
} from 'lucide-react';
import { ContractStageIndicator } from '@/components/contract-stage-indicator';
import { SmartActionButtons } from '@/components/smart-action-buttons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
    DRAFT: 'secondary',
    PENDING_LEGAL: 'warning',
    PENDING_FINANCE: 'warning',
    LEGAL_APPROVED: 'info',
    FINANCE_APPROVED: 'info',
    APPROVED: 'success',
    SENT_TO_COUNTERPARTY: 'info',
    COUNTERSIGNED: 'success',
    ACTIVE: 'success',
    EXPIRED: 'error',
    TERMINATED: 'error',
    REJECTED: 'error',
    CANCELLED: 'error',
};

interface Contract {
    id: string;
    reference: string;
    title: string;
    status: string;
    counterpartyName: string | null;
    counterpartyEmail: string | null;
    content?: string;
    annexureData: string;
    fieldData: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    startDate?: string;
    endDate?: string;
    amount?: number;
    description?: string;
    template: { id: string; name: string; code: string; category: string };
    createdByUser: { id: string; name: string; email: string };
    versions: { id: string; version: number; createdAt: string; createdBy?: { name: string } }[];
    approvals: { id: string; type: string; status: string; assignedUser?: { name: string } }[];
    attachments: { id: string; fileUrl: string; fileType: string; fileName: string }[];
}

const VersionCard = ({ version, index, total, onPreview, isLatest }: any) => (
    <div className={`
        relative rounded-xl border p-5 flex flex-col justify-between transition-all group h-full bg-white
        ${isLatest
            ? 'border-orange-200 shadow-md shadow-orange-500/5 ring-1 ring-orange-100'
            : 'border-slate-200 hover:border-orange-200 hover:shadow-md'
        }
    `}>
        {isLatest && (
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-lg">
                LATEST
            </div>
        )}

        <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 text-xs font-mono">
                    v{version.version || (total - index)}
                </Badge>
            </div>

            <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isLatest ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                    {version.createdBy?.name?.charAt(0) || 'U'}
                </div>
                <p className="text-sm font-medium text-slate-900 truncate">
                    {version.createdBy?.name || 'Unknown User'}
                </p>
            </div>

            <div className="flex items-center gap-1.5 pl-8 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 mx-0.5" />
                <span>{new Date(version.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-50">
            <Button
                size="sm"
                variant="ghost"
                className={`w-full group-hover:bg-orange-50 group-hover:text-orange-600 ${isLatest ? 'text-orange-700 bg-orange-50' : 'text-slate-600'}`}
                onClick={() => onPreview(version)}
            >
                <Eye className="w-4 h-4 mr-2" />
                View Document
            </Button>
        </div>
    </div>
);

function ContractDetailContent() {
    const params = useParams();
    const router = useRouter();
    const { success, error: toastError } = useToast();

    // Permissions
    const canEdit = usePermission('contract:edit');
    const canSubmit = usePermission('contract:submit');
    const canSend = usePermission('contract:send');
    const canApproveLegal = usePermission('approval:legal:act');
    const canApproveFinance = usePermission('approval:finance:act');

    const [contract, setContract] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Preview Modal State
    const [previewVersion, setPreviewVersion] = useState<any | null>(null);
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const data = await api.contracts.get(params.id as string);
                setContract(data as any);
            } catch (err) {
                console.error('Failed to fetch contract:', err);
                toastError('Error', 'Failed to load contract');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContract();
    }, [params.id, toastError]);

    // Handle Actions
    const handleAction = async (action: string, payload?: any) => {
        if (!contract) return;
        setActionLoading(true);
        try {
            if (action === 'submit') {
                await api.contracts.submit(contract.id);
                success('Submitted', 'Contract submitted for approval');
            } else if (action === 'send') {
                await api.contracts.send(contract.id);
                success('Sent', 'Contract sent to counterparty');
            } else if (action === 'upload_signed' && payload) {
                if (payload.type !== 'application/pdf') throw new Error('Please upload a valid PDF file');
                await api.contracts.uploadSigned(contract.id, payload);
                success('Active', 'Contract signed and activated');
            }
            // Refresh
            const data = await api.contracts.get(contract.id);
            setContract(data as any);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Action failed';
            toastError('Error', msg);
        } finally {
            setActionLoading(false);
        }
    };

    // Load attachment URL for upload previews
    useEffect(() => {
        if (contract?.attachments?.length && !attachmentUrl) {
            const loadUrl = async () => {
                try {
                    const res = await api.contracts.getAttachmentDownloadUrl(contract.id, contract.attachments[0].id);
                    setAttachmentUrl(res.url);
                } catch (e) { console.error(e); }
            };
            loadUrl();
        }
    }, [contract, attachmentUrl]);


    // Preview Logic
    const handlePreview = async (version: any) => {
        setPreviewVersion(version);
    };

    const processVariables = (htmlContent: string, data: any) => {
        if (!htmlContent) return "";
        return htmlContent.replace(/<span[^>]*data-variable="([^"]+)"[^>]*>.*?<\/span>/g, (match, key) => {
            return data[key] ? String(data[key]) : match;
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
    if (!contract) return <div>Contract Not Found</div>;

    const sortedVersions = [...(contract.versions || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Ensure we always have at least one "version" to show (current state)
    const displayVersions = sortedVersions.length > 0 ? sortedVersions : [{
        id: 'current',
        version: 1,
        createdAt: contract.createdAt,
        createdBy: contract.createdByUser
    }];

    return (
        <div className="min-h-screen pb-20 bg-slate-50/50">
            {/* 1. HERO, METADATA & ACTIONS */}
            <div className="bg-white border-b border-slate-200 pb-10 pt-6 px-6 md:px-12 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50/50 opacity-40 mix-blend-multiply pointer-events-none" />

                <div className="max-w-[1400px] mx-auto relative z-10">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center text-sm text-slate-500 mb-8 font-medium">
                        <Link href="/dashboard/contracts" className="hover:text-slate-900 transition-colors">Contracts</Link>
                        <ChevronRight className="w-4 h-4 mx-1.5 text-slate-400" />
                        <span className="text-slate-900 truncate max-w-[300px]">{contract.title}</span>
                    </nav>

                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-10">
                        <div className="flex-1 space-y-6">
                            <div>
                                <div className="flex items-center gap-4 mb-3">
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{contract.title}</h1>
                                    <Badge variant={statusColors[contract.status]} className="h-7 px-3 text-xs font-bold uppercase tracking-wider">{contract.status.replace(/_/g, ' ')}</Badge>
                                </div>
                                <p className="text-slate-500 max-w-2xl text-lg">{contract.description || "Contract Management Workflow"}</p>
                            </div>

                            {/* Metadata Strip */}
                            <div className="flex flex-wrap items-center gap-6 text-sm">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-500 font-medium">{contract.counterpartyName || 'No Counterparty'}</span>
                                </div>
                                {contract.amount && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                                        <span className="text-slate-400 font-bold">₹</span>
                                        <span className="text-slate-500 font-medium">{formatCurrency(contract.amount)}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-500 font-medium truncate max-w-[200px]">{contract.counterpartyEmail || 'No Email'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Smart Action Center */}
                        <div className="w-full xl:w-auto flex flex-col items-end gap-4 min-w-[300px]">
                            <div className="p-1 bg-white rounded-xl shadow-lg shadow-orange-500/10 border border-orange-100 w-full">
                                <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100/50">
                                    <div className="flex items-center gap-2 text-xs font-bold text-orange-800 uppercase tracking-wider mb-3">
                                        <Sparkles className="w-4 h-4 text-orange-600" />
                                        Suggested Action
                                    </div>
                                    <SmartActionButtons
                                        contract={contract}
                                        permissions={{ canEdit, canSubmit, canApproveLegal, canApproveFinance, canSend }}
                                        loading={actionLoading}
                                        onAction={handleAction}
                                    />
                                </div>
                            </div>

                            <Link href={`/dashboard/contracts/${contract.id}/analysis`} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors group">
                                <Wand2 className="w-3.5 h-3.5 group-hover:text-indigo-600" />
                                Run AI Analysis
                            </Link>
                        </div>
                    </div>

                    {/* Stage Indicator */}
                    <div className="mt-12">
                        <ContractStageIndicator currentStatus={contract.status} />
                    </div>
                </div>
            </div>

            {/* 2. VERSION GRID & PREVIEW TOGGLE */}
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-slate-400" />
                            Version History
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Full history of edits and snapshots.</p>
                    </div>
                </div>

                {displayVersions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-400">No versions recorded yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayVersions.map((v, i) => (
                            <VersionCard
                                key={v.id}
                                version={v}
                                index={i}
                                total={displayVersions.length}
                                isLatest={i === 0}
                                onPreview={handlePreview}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 3. PREVIEW MODAL */}
            <Dialog open={!!previewVersion} onOpenChange={(open) => !open && setPreviewVersion(null)}>
                <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100 border-none shadow-2xl">
                    <DialogHeader className="px-6 py-4 bg-white border-b border-slate-200 flex flex-row items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                                <FileText className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    {contract.title}
                                    <Badge variant="outline" className="ml-2 bg-slate-50 text-slate-500 border-slate-200">
                                        v{previewVersion?.version || 'Latest'}
                                    </Badge>
                                </DialogTitle>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Created by {previewVersion?.createdBy?.name || 'Unknown'} on {previewVersion && new Date(previewVersion.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setPreviewVersion(null)} className="rounded-full hover:bg-slate-100">
                            <X className="w-5 h-5 text-slate-400" />
                        </Button>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden bg-slate-100 flex items-center justify-center p-4">
                        <div className="bg-white shadow-2xl w-full h-full max-w-[1000px] border border-slate-200 overflow-y-auto rounded-lg">
                            {/* Determine URL to show: Attachment or HTML */}
                            {contract.attachments && contract.attachments.length > 0 ? (
                                <iframe
                                    src={attachmentUrl || ''}
                                    className="w-full h-full min-h-[800px] border-none"
                                    title="Document Preview"
                                />
                            ) : (
                                <div className="p-16 prose prose-slate max-w-none">
                                    <SafeHtml html={processVariables(contract.content + (contract.annexureData || ''), contract)} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 shrink-0">
                        <span>Preview Mode • Read Only</span>
                        <span>Generated by Lumina CLM</span>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function ContractDetailPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
            <ContractDetailContent />
        </Suspense>
    );
}
