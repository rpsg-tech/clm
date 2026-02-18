'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Spinner, Skeleton, Textarea } from '@repo/ui';
import { SafeHtml } from '@/components/SafeHtml';
import { VersionHistoryView } from '@/components/version-history-view';
import { VersionDiffViewer } from '@/components/version-diff-viewer';
import { useAuth, usePermission } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { api } from '@/lib/api-client';
import {
    ArrowLeft,
    FileText,
    Clock,
    History,
    ChevronRight,
    Sparkles,
    Calendar,
    User,
    Mail,
    X,
    AlertCircle,
    Building2,
    Briefcase,
    Check,
    AlertTriangle,
    IndianRupee,
    Edit,
    Ban,
    UploadCloud
} from 'lucide-react';
import { SmartActionButtons } from '@/components/smart-action-buttons';
import { ContractDiffView } from '@/components/contract-diff-view';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FeatureGuard } from '@/components/feature-guard';
import { ContractAssistantSidebar } from '@/components/contract-assistant-sidebar';
import { EscalateDialog } from '@/components/escalate-dialog';
import { ContractUploadDialog } from '@/components/contract-upload-dialog';


interface Contract {
    id: string;
    reference: string;
    title: string;
    status: string;
    counterpartyName: string | null;
    counterpartyBusinessName?: string | null;
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
    versions: { id: string; versionNumber: number; createdAt: string; createdBy?: { name: string, id: string } }[];
    approvals: { id: string; type: string; status: string; assignedUser?: { name: string }; createdAt?: string; updatedAt?: string; comment?: string }[];
    attachments: { id: string; fileUrl: string; fileType: string; fileName: string }[];
}

interface ActivityItem {
    id: string;
    type: 'VERSION' | 'AUDIT';
    title: string;
    user: string;
    role?: string;
    date: Date;
    meta?: any;
    visibility?: string;
}


function ContractDetailContent() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();

    // Permissions
    const permissions = {
        canEdit: usePermission('contract:edit'),
        canSubmit: usePermission('contract:submit'),
        canSend: usePermission('contract:send'),
        canApproveLegal: usePermission('approval:legal:act'),
        canApproveFinance: usePermission('approval:finance:act'),
        canRestore: usePermission('contract:restore'),
        canCancel: usePermission('contract:cancel'),
    };

    const [contract, setContract] = useState<Contract | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'document' | 'history'>('document');

    // Preview Modal State
    const [previewVersion, setPreviewVersion] = useState<any | null>(null);
    const [isDiffMode, setIsDiffMode] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(true);
    const [comparisonMode, setComparisonMode] = useState(false);
    const [comparisonVersions, setComparisonVersions] = useState<string[]>([]);
    const [showEscalateDialog, setShowEscalateDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [diffData, setDiffData] = useState<any>(null);
    const [isDiffLoading, setIsDiffLoading] = useState(false);


    // Initial Fetch
    useEffect(() => {
        const fetchContract = async () => {
            try {
                // First fetch contract to ensure it exists
                const contractData = await api.contracts.get(params.id as string);
                setContract(contractData as any);

                // Then fetch audit logs (requires contract permission)
                try {
                    const auditData = await api.contracts.getAuditLogs(params.id as string);
                    setAuditLogs(auditData);
                } catch (auditErr) {
                    console.error('Failed to fetch audit logs', auditErr);
                    // Don't block page load if audit fails
                }

                if ((contractData as any).attachments?.length > 0) {
                    try {
                        const attachments = (contractData as any).attachments;
                        const lastAttachment = attachments[attachments.length - 1];
                        const downloadData = await api.contracts.getAttachmentDownloadUrl((contractData as any).id, lastAttachment.id);
                        setAttachmentUrl(downloadData.url);
                    } catch (e) {
                        console.error('Failed to get attachment URL', e);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch contract:', err);
                toast.error('Error', 'Failed to load contract');
            } finally {
                setIsLoading(false);
            }
        };
        fetchContract();
    }, [params.id]);

    const handleAction = async (action: string, payload?: any) => {
        if (!contract) return;

        if (action === 'open_upload_dialog') {
            setIsUploadDialogOpen(true);
            return;
        }

        setActionLoading(true);
        try {
            if (action === 'submit') {
                await api.contracts.submit(contract.id, payload);
                toast.success('Submitted', 'Contract submitted for approval');
            } else if (action === 'send') {
                await api.contracts.send(contract.id);
                toast.success('Sent', 'Contract sent to counterparty');
            } else if (action === 'upload_signed' && payload) {
                await api.contracts.uploadSigned(contract.id, payload);
                toast.success('Active', 'Contract signed and activated');
            } else if (action === 'cancel') {
                const reason = payload?.reason || 'No reason provided';
                await api.contracts.cancel(contract.id, reason);
                toast.success('Cancelled', 'Contract has been cancelled');
            } else if (action === 'request_revision') {
                await api.approvals.requestRevision(payload.id, payload.comment);
                toast.success('Request Sent', 'Revision requested successfully');
            } else if (action === 'approve_legal' || action === 'approve_finance') {
                const approvalType = action === 'approve_legal' ? 'LEGAL' : 'FINANCE';
                const approval = contract.approvals?.find((a: any) => a.type === approvalType && a.status === 'PENDING');
                if (approval) {
                    await api.approvals.approve(approval.id, payload?.comment || '');
                    toast.success('Approved', `Contract approved (${approvalType})`);
                }
            } else if (action === 'reject_legal' || action === 'reject_finance') {
                const approvalType = action === 'reject_legal' ? 'LEGAL' : 'FINANCE';
                const approval = contract.approvals?.find((a: any) => a.type === approvalType && a.status === 'PENDING');
                if (approval) {
                    await api.approvals.reject(approval.id, payload?.comment || 'Rejected');
                    toast.success('Rejected', `Contract rejected (${approvalType})`);
                }
            } else if (action === 'escalate_to_legal_head') {
                // Open dialog instead of directly escalating
                setShowEscalateDialog(true);
                return; // Don't refresh yet
            } else if (action === 'return_to_manager') {
                await api.approvals.returnToManager(payload.id, payload.comment);
                toast.success('Returned', 'Contract returned to Legal Manager');
            }

            // Refresh data
            const [data, logs] = await Promise.all([
                api.contracts.get(contract.id),
                api.contracts.getAuditLogs(contract.id)
            ]);
            setContract(data as any);
            setAuditLogs(logs);
        } catch (err: unknown) {
            toast.error('Error', err instanceof Error ? err.message : 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmCancel = async () => {
        await handleAction('cancel', { reason: cancelReason });
        setShowCancelDialog(false);
        setCancelReason('');
    };

    const handlePreview = async (version: any, diff: boolean = false) => {
        // If snapshot is missing, fetch full details
        let previewData = version;

        setIsDiffMode(diff);
        setPreviewVersion(previewData); // Open modal immediately with what we have

        if (!version.contentSnapshot && version.id !== 'current') {
            try {
                const fullVersion = await api.contracts.getVersion(contract!.id, version.id);
                previewData = { ...version, ...fullVersion };
                setPreviewVersion(previewData);
            } catch (e) {
                console.error("Failed to fetch version details", e);
                toast.error("Error", "Failed to load version content");
            }
        }

        if (diff) {
            setIsDiffLoading(true);
            try {
                const data = await api.contracts.compareVersions(contract!.id, version.id, 'current');
                setDiffData(data);
            } catch (e) {
                console.error("Failed to fetch diff data", e);
                toast.error("Error", "Failed to calculate version difference");
            } finally {
                setIsDiffLoading(false);
            }
        }
    };

    const processVariables = (htmlContent: string, data: any) => {
        if (!htmlContent) return "";
        return htmlContent.replace(/<span[^>]*data-variable="([^"]+)"[^>]*>.*?<\/span>/g, (match, key) => {
            return data.fieldData?.[key] || data[key] ? String(data.fieldData?.[key] || data[key]) : match;
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const getSnapshotContent = (snapshot: string | any) => {
        if (!snapshot) return "";
        if (typeof snapshot === 'string' && snapshot.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(snapshot);
                // Return structured data if available, or just main text
                return {
                    main: parsed.main || parsed.extractedText || "",
                    annexures: parsed.annexures || ""
                };
            } catch (e) {
                return snapshot;
            }
        }
        return snapshot;
    };

    // Prepare Activity Stream
    const getActivityStream = (): ActivityItem[] => {
        if (!contract) return [];
        const items: ActivityItem[] = [];

        // 1. Versions
        contract.versions.forEach(v => {
            items.push({
                id: `v-${v.id}`,
                type: 'VERSION',
                title: `Created version`, // Removed v${version} to avoid duplication
                user: v.createdBy?.name || 'Unknown',
                role: (v.createdBy as any)?.organizationRoles?.[0]?.role?.name,
                date: new Date(v.createdAt),
                meta: { version: v.versionNumber }
            });
        });

        // 2. Audit Logs
        auditLogs.forEach(log => {
            // Map actions to readable titles
            let title = log.action.replace('CONTRACT_', '').replace(/_/g, ' ');
            title = title.charAt(0) + title.slice(1).toLowerCase();

            // Customize specific actions if needed
            if (log.action === 'CONTRACT_SUBMITTED') title = 'Submitted for Approval';
            if (log.action === 'CONTRACT_SENT') title = 'Sent to Counterparty';
            if (log.action === 'CONTRACT_SIGNED') title = 'Signed by Counterparty';

            items.push({
                id: `audit-${log.id}`,
                type: 'AUDIT',
                title: title,
                user: log.user?.name || 'System',
                role: log.user?.organizationRoles?.find((or: any) => or.organizationId === log.organizationId)?.role?.name
                    || log.user?.organizationRoles?.[0]?.role?.name,
                date: new Date(log.createdAt),
                meta: log.metadata,
                visibility: log.visibility
            });
        });

        return items.sort((a, b) => b.date.getTime() - a.date.getTime());
    };

    const activityStream = getActivityStream();

    // Helper for Status Color
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'DRAFT': 'bg-slate-500',
            'SENT_TO_LEGAL': 'bg-indigo-500', // Legal stays indigo/purple usually
            'SENT_TO_FINANCE': 'bg-cyan-500',
            'APPROVED': 'bg-green-500',
            'SENT_FOR_SIGNATURE': 'bg-purple-500',
            'SIGNED': 'bg-orange-500',
            'ACTIVE': 'bg-emerald-500',
            'EXPIRED': 'bg-slate-500',
        };
        return colors[status] || 'bg-slate-500';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'DRAFT': 'Draft',
            'PENDING_APPROVAL': 'Pending Approval',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected',
            'SENT_FOR_SIGNATURE': 'Sent for Signature',
            'SIGNED': 'Active',
            'CANCELLED': 'Cancelled',
        };
        return labels[status] || status;
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Spinner size="lg" /></div>;
    if (!contract) return <div className="flex h-screen items-center justify-center text-slate-500">Contract Not Found</div>;

    const sortedVersions = [...(contract.versions || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const displayVersions = sortedVersions.length > 0 ? sortedVersions : [{
        id: 'current', versionNumber: 1, createdAt: contract.createdAt, createdBy: contract.createdByUser
    }];

    // Handle escalation to Legal Head
    const handleEscalation = async (reason?: string) => {
        if (!contract) return;
        setActionLoading(true);
        try {
            await api.approvals.escalateToLegalHead(contract.id, reason);
            toast.success('Escalated', 'Contract escalated to Legal Head for final approval');

            // Refresh contract data
            const [data, logs] = await Promise.all([
                api.contracts.get(contract.id),
                api.contracts.getAuditLogs(contract.id)
            ]);
            setContract(data as any);
            setAuditLogs(logs);
        } catch (err: unknown) {
            toast.error('Error', err instanceof Error ? err.message : 'Escalation failed');
            throw err;
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] w-full relative overflow-hidden bg-slate-50/50 flex flex-col rounded-xl border border-slate-200 shadow-sm">
            {/* 1. COMPACT HEADER (Toolbar Style) */}
            <div className="min-h-[56px] lg:min-h-[64px] py-2 lg:py-3 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 shadow-sm">
                <div className="flex-1 min-w-0 flex items-center gap-2.5 lg:gap-4">
                    <Link href="/dashboard/contracts" className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="flex items-start gap-3">
                        <Button
                            onClick={() => setIsInfoOpen(!isInfoOpen)}
                            variant="ghost"
                            size="sm"
                            className={`h-9 w-9 p-0 rounded-full transition-colors shrink-0 ${isInfoOpen ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                            title="Contract Info"
                        >
                            <FileText className="w-4 h-4" />
                        </Button>
                        <div className="flex flex-col gap-0.5 overflow-hidden min-w-0">
                            <h1 className="text-sm lg:text-base font-bold text-slate-900 leading-tight truncate" title={contract.title}>
                                {contract.title}
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">{contract.reference || 'REF-???'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <Badge variant="outline" className="text-[10px] px-2 py-0 h-4.5 bg-orange-50 text-orange-600 border-orange-100 font-bold uppercase tracking-wide">
                                    {contract.template?.name || 'General Template'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTION TOOLBAR - Preserved SmartActionButtons */}
                <div className="flex items-center gap-1.5 lg:gap-3 shrink-0 ml-2">
                    <div className="flex items-center gap-1 lg:gap-2">
                        {/* AI Button - Subtle */}
                        <FeatureGuard feature="AI_CONTRACT_REVIEW">
                            <Button
                                onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 lg:h-9 lg:w-9 p-0 rounded-full transition-colors ${isAnalysisOpen ? 'bg-orange-100 text-orange-600' : 'text-orange-500 hover:bg-orange-50 hover:text-orange-600'}`}
                                title="AI Assistant"
                            >
                                <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                            </Button>
                        </FeatureGuard>

                        <div className="h-6 lg:h-8 w-px bg-slate-200 mx-0.5 lg:mx-1" />
                    </div>

                    <SmartActionButtons
                        contract={contract}
                        permissions={permissions}
                        loading={actionLoading}
                        onAction={handleAction}
                        compact={true}
                        hideStatus={true}
                        hideSecondary={false}
                    />
                </div>
            </div>

            {/* 2. MAIN LAYOUT: Sidebars + Workspace */}
            <div className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden min-h-0 relative">

                {/* LEFT SIDEBAR - "CONTRACT INFO" */}
                <div className={`
                    absolute inset-y-0 left-0 z-40 lg:relative lg:inset-auto
                    border-r border-slate-200 bg-white lg:bg-slate-50/30 transition-all duration-300 ease-in-out flex flex-col shrink-0 overflow-y-auto overflow-x-hidden
                    ${isInfoOpen ? 'w-[320px] opacity-100 p-6 shadow-2xl lg:shadow-none translate-x-0' : 'w-0 opacity-0 p-0 -translate-x-full lg:translate-x-0'}
                `}>
                    <div className="w-[272px] space-y-6">
                        {/* SMART ACTIONS - Status & Sidebar Buttons */}
                        <SmartActionButtons
                            contract={contract}
                            permissions={permissions}
                            loading={actionLoading}
                            onAction={handleAction}
                            location="sidebar"
                        />

                        {/* KEY METRICS GROUP - Simplified */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5 transition-all duration-300">
                            <div>
                                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-1">Total Contract Value</span>
                                <div className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
                                    {contract.amount ? formatCurrency(contract.amount) : 'N/A'}
                                </div>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-orange-100/50">
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-slate-500 font-medium flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-orange-300" /> Start Date</span>
                                    <span className="font-bold text-slate-700 font-mono bg-orange-50/50 px-2 py-0.5 rounded text-[11px]">{contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-slate-500 font-medium flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-orange-300" /> End Date</span>
                                    <span className="font-bold text-slate-700 font-mono bg-orange-50/50 px-2 py-0.5 rounded text-[11px]">{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* COUNTERPARTY GROUP */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Counterparty</span>
                                <Building2 className="w-3 h-3 text-slate-300 group-hover:text-orange-400 transition-colors" />
                            </div>
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-white text-orange-600 flex items-center justify-center text-sm font-bold border border-slate-100 shadow-sm shrink-0">
                                        {contract.counterpartyName?.charAt(0) || 'C'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-[13px] font-bold text-slate-900 truncate">
                                            {contract.counterpartyBusinessName || contract.counterpartyName || 'Unknown Entity'}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                            {contract.fieldData?.taxId as string || 'Tax ID: N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5 border-t border-slate-50 pt-3">
                                    <div className="flex items-center gap-2.5 text-[12px] text-slate-600">
                                        <User className="w-3 h-3 text-slate-400" />
                                        <span className="truncate">{contract.counterpartyName || 'No Contact'}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-[12px] text-slate-600">
                                        <Mail className="w-3 h-3 text-slate-400" />
                                        <span className="truncate hover:text-orange-600 cursor-pointer transition-colors">{contract.counterpartyEmail || 'No Email'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PEOPLE GROUP */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ownership</span>
                                <User className="w-3 h-3 text-slate-300" />
                            </div>
                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-bold border border-orange-100">
                                        {(contract.createdByUser?.name || 'A').charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-bold text-slate-900 shadow-none">
                                            {contract.createdByUser?.name || 'Admin'}
                                        </div>
                                        <div className="text-[9px] text-orange-500 font-bold uppercase tracking-wide">Internal Owner</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Sidebar Backdrop - Mobile Only */}
                {isInfoOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-30 lg:hidden"
                        onClick={() => setIsInfoOpen(false)}
                    />
                )}

                {/* THE WORKSPACE */}
                <div className="flex-1 min-w-0 min-h-0 p-6 flex flex-col items-center">
                    <div className="w-full max-w-[1000px] flex flex-col flex-1 min-h-0">

                        {/* TABS HEADER */}
                        <div className="bg-white rounded-t-xl border border-slate-200 border-b-0 px-3 lg:px-4 pt-1.5 lg:pt-2 flex items-center justify-between shrink-0 overflow-x-auto custom-scrollbar no-scrollbar">
                            <div className="flex items-center gap-3 sm:gap-6 min-w-max">
                                <button
                                    onClick={() => setActiveTab('document')}
                                    className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'document' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'}`}
                                >
                                    Document Preview
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'history' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'}`}
                                >
                                    Version History
                                </button>
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'overview' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'}`}
                                >
                                    Activity Feed
                                </button>
                            </div>

                            <button
                                onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                                className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all duration-200 whitespace-nowrap ml-3 ${isAnalysisOpen ? 'text-orange-600' : 'text-slate-400 hover:text-orange-500'}`}
                            >
                                <Sparkles className={`w-3 h-3 sm:w-4 sm:h-4 ${isAnalysisOpen ? 'fill-orange-600/10' : ''}`} />
                                <span className="hidden sm:inline">AI Assistant</span>
                                <span className="sm:hidden">AI</span>
                            </button>
                        </div>

                        {/* TAB CONTENT AREA */}
                        <div className="bg-white border border-slate-200 rounded-b-xl rounded-tr-xl p-0 overflow-hidden shadow-sm flex flex-1 min-h-0">
                            <div className="flex-1 min-w-0 flex flex-col min-h-0">
                                {activeTab === 'overview' && (
                                    <div className="p-6 overflow-y-auto min-h-0 flex-1">
                                        <div className="max-w-2xl">
                                            <h3 className="text-sm font-bold text-slate-900 mb-5 lg:mb-6 flex items-center gap-2">
                                                <History className="w-4 h-4 text-slate-400" />
                                                Latest Updates
                                            </h3>

                                            <div className="space-y-0 relative pl-1.5 lg:pl-4">
                                                {/* Timeline Line */}
                                                <div className="absolute left-[13px] lg:left-[15px] top-2 bottom-6 w-0.5 bg-slate-100" />

                                                {activityStream.map((item, i) => (
                                                    <div key={item.id} className="flex gap-3 lg:gap-4 relative pb-6 lg:pb-8 last:pb-0 group">
                                                        <div className={`
                                                        relative z-10 w-7 h-7 lg:w-8 lg:h-8 rounded-full border-2 flex items-center justify-center shrink-0 bg-white transition-colors
                                                        ${i === 0 ? 'border-orange-500 text-orange-600 shadow-sm shadow-orange-100' : 'border-slate-200 text-slate-400 group-hover:border-slate-300'}
                                                    `}>
                                                            {item.type === 'VERSION' ? (
                                                                item.meta?.source === 'UPLOAD' ? <UploadCloud className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : <FileText className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                                            ) : <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
                                                        </div>
                                                        <div className="pt-1 flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className={`text-sm font-bold ${i === 0 ? 'text-slate-900' : 'text-slate-600'}`}>
                                                                    {item.title}
                                                                </div>
                                                                {item.visibility && item.visibility !== 'PUBLIC' && (
                                                                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 uppercase tracking-tighter font-bold shadow-none ${item.visibility === 'LEGAL_ONLY' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                        {item.visibility.replace('_', ' ')}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <User className="w-3 h-3" />
                                                                    {item.user}
                                                                </span>
                                                                {item.role && (
                                                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0 rounded border border-orange-100">
                                                                        {item.role}
                                                                    </span>
                                                                )}
                                                                <span className="text-slate-300">•</span>
                                                                <span className="font-medium">
                                                                    {item.date.toLocaleDateString('en-IN', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>

                                                            {/* Detailed Metadata */}
                                                            {item.meta && (
                                                                <div className="mt-2 space-y-2">
                                                                    {item.meta.comment && (
                                                                        <div className="text-[13px] text-slate-700 bg-slate-50/80 p-3 rounded-lg border border-slate-100 italic">
                                                                            &ldquo;{item.meta.comment}&rdquo;
                                                                        </div>
                                                                    )}
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {item.meta.target && (
                                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100">
                                                                                <Building2 className="w-3 h-3" />
                                                                                Target: {item.meta.target}
                                                                            </span>
                                                                        )}
                                                                        {item.meta.version && (
                                                                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-100">
                                                                                Version {item.meta.version}
                                                                            </span>
                                                                        )}
                                                                        {item.meta.source && (
                                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200 uppercase">
                                                                                Source: {item.meta.source}
                                                                            </span>
                                                                        )}
                                                                        {item.meta.escalatedTo && (
                                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-100">
                                                                                Escalated to: {item.meta.escalatedTo}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'document' && (
                                    <div className="flex-1 bg-slate-100 overflow-hidden flex flex-col">
                                        {attachmentUrl ? (
                                            <iframe src={attachmentUrl} className="w-full h-full border-none" title="Contract PDF" />
                                        ) : contract.content ? (
                                            <div className="flex-1 overflow-auto p-8 md:p-12">
                                                <div className="max-w-4xl mx-auto bg-white shadow-lg min-h-full p-12 print:shadow-none print:p-0">
                                                    <div className="prose max-w-none prose-sm sm:prose-base prose-headings:font-serif prose-headings:font-bold">
                                                        <SafeHtml html={processVariables(contract.content, contract)} />
                                                        {contract.annexureData && (
                                                            <>
                                                                <hr className="my-8 border-slate-200" />
                                                                <h3 className="text-xl font-bold text-slate-900 mb-4">Annexures</h3>
                                                                {(() => {
                                                                    try {
                                                                        const parsed = JSON.parse(contract.annexureData);
                                                                        if (Array.isArray(parsed)) {
                                                                            return parsed.map((item: any, index: number) => (
                                                                                <div key={item.id || index} className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                                                                                    <h4 className="text-lg font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200">
                                                                                        {item.title || item.name || `Annexure ${index + 1}`}
                                                                                    </h4>
                                                                                    <div className="prose-sm">
                                                                                        <SafeHtml html={item.content} />
                                                                                    </div>
                                                                                </div>
                                                                            ));
                                                                        }
                                                                    } catch (e) {
                                                                        // Not JSON, render as is
                                                                    }
                                                                    return <SafeHtml html={contract.annexureData} />;
                                                                })()}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                                                <FileText className="w-12 h-12 opacity-20" />
                                                <p>Document content not available</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <div className="p-6 flex-1 overflow-y-auto">
                                        {comparisonMode && comparisonVersions.length === 2 ? (
                                            <VersionDiffViewer
                                                contractId={contract.id}
                                                fromVersionId={comparisonVersions[0]}
                                                toVersionId={comparisonVersions[1]}
                                                versions={contract.versions || []}
                                                onBack={() => setComparisonMode(false)}
                                            />
                                        ) : (
                                            <VersionHistoryView
                                                contractId={contract.id}
                                                onPreview={(v) => handlePreview(v, false)}
                                                onCompare={(v1, v2) => {
                                                    setComparisonVersions([v1, v2]);
                                                    setComparisonMode(true);
                                                }}
                                                onRestore={async (id) => {
                                                    try {
                                                        toast.info('Restoring contract version...');
                                                        await api.contracts.restoreVersion(contract.id, id);
                                                        toast.success('Contract restored successfully!');
                                                        window.location.reload();
                                                    } catch (err) {
                                                        toast.error('Failed to restore version');
                                                    }
                                                }}
                                                canRestore={permissions.canRestore}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* COLLAPSIBLE AI SIDEBAR */}
                            <div className={`
                            border-l border-slate-200 bg-white transition-all duration-300 ease-in-out flex flex-col shrink-0
                            ${isAnalysisOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}
                        `}>
                                <ContractAssistantSidebar
                                    embedded
                                    className="h-full"
                                    contractId={contract.id}
                                    content={processVariables(contract.content || "", contract)}
                                    details={contract}
                                    versionData={diffData ? { changelog: diffData.summary || "Significant changes detected between versions." } : undefined}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cancel Dialog */}
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Cancel Contract</DialogTitle>
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
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                                Keep Contract
                            </Button>
                            <Button variant="destructive" onClick={handleConfirmCancel} disabled={!cancelReason.trim()}>
                                Confirm Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* PREVIEW MODAL */}
                <Dialog open={!!previewVersion} onOpenChange={(open) => !open && setPreviewVersion(null)}>
                    <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 bg-slate-50">
                        <DialogHeader className="px-6 py-4 border-b bg-white">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        {isDiffMode ? (
                                            <>Comparing with Previous Version</>
                                        ) : (
                                            <>
                                                {contract.title}
                                                <Badge variant="outline" className="ml-2 bg-slate-50 text-slate-500 border-slate-200">
                                                    v{previewVersion?.versionNumber || 'Latest'}
                                                </Badge>
                                            </>
                                        )}
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
                            <div className="bg-white shadow-2xl w-full h-full max-w-[1240px] border border-slate-200 overflow-y-auto rounded-lg">
                                {isDiffMode ? (
                                    isDiffLoading ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                                            <Spinner size="lg" className="text-indigo-600" />
                                            <p className="text-sm font-medium">Calculating professional differences...</p>
                                        </div>
                                    ) : (
                                        <ContractDiffView
                                            diffData={diffData}
                                            oldVersionLabel={`v${previewVersion?.versionNumber}`}
                                            newVersionLabel={`Current`}
                                        />
                                    )
                                ) : (
                                    <div className="flex flex-col h-full overflow-y-auto">
                                        {(() => {
                                            if (previewVersion) {
                                                const snapshot = getSnapshotContent(previewVersion.contentSnapshot);

                                                // Handle PENDING OCR state
                                                if (typeof snapshot === 'object' && snapshot.ocrStatus === 'PENDING') {
                                                    return (
                                                        <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-4 p-20">
                                                            <div className="relative">
                                                                <FileText className="w-16 h-16 opacity-10 animate-pulse" />
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <Spinner size="sm" className="text-orange-400" />
                                                                </div>
                                                            </div>
                                                            <div className="text-center space-y-1">
                                                                <p className="text-sm font-bold text-slate-700">Document Processing...</p>
                                                                <p className="text-xs text-slate-500 max-w-[240px]">
                                                                    We're currently extracting text from this document.
                                                                    This usually takes a few seconds.
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePreview(previewVersion, isDiffMode)}
                                                                className="mt-2"
                                                            >
                                                                Refresh Preview
                                                            </Button>
                                                        </div>
                                                    );
                                                }

                                                // If it's an object with split content (our new format)
                                                return (
                                                    <div className="p-16 prose prose-slate max-w-none">
                                                        <SafeHtml html={processVariables(
                                                            typeof snapshot === 'object'
                                                                ? (snapshot.main || '') + (snapshot.annexures || '')
                                                                : String(snapshot || ''),
                                                            contract
                                                        )} />
                                                    </div>
                                                );
                                            }
                                            // Current State
                                            return (
                                                <div className="p-16 prose prose-slate max-w-none">
                                                    <SafeHtml html={processVariables((contract.content || '') + (contract.annexureData || ''), contract)} />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <EscalateDialog
                    open={showEscalateDialog}
                    onOpenChange={setShowEscalateDialog}
                    contractId={contract?.id || ''}
                    contractTitle={contract?.title || ''}
                    onEscalate={handleEscalation}
                />

                <ContractUploadDialog
                    isOpen={isUploadDialogOpen}
                    onClose={() => setIsUploadDialogOpen(false)}
                    contractId={contract?.id}
                    contractTitle={contract?.title}
                    onUploadComplete={async () => {
                        setIsUploadDialogOpen(false);
                        // Refresh data
                        setIsLoading(true); // Show loading state
                        try {
                            const [data, logs] = await Promise.all([
                                api.contracts.get(contract!.id),
                                api.contracts.getAuditLogs(contract!.id)
                            ]);
                            setContract(data as any);
                            setAuditLogs(logs);
                            toast.success("Success", "Contract updated successfully");
                        } catch (e) {
                            console.error(e);
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                />
            </div>
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
