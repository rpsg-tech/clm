'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Spinner, Skeleton } from '@repo/ui';
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
    FileCheck,
    GitCompare,
    CheckCircle2,
    AlertCircle,
    Building2,
    Ban,
    Zap,
    Briefcase,
    Shield,
    PenTool,
    Info,
    Send,
    ExternalLink,
    Check,
    Share2,
    AlertTriangle
} from 'lucide-react';
import { SmartActionButtons } from '@/components/smart-action-buttons';
import { ContractDiffView } from '@/components/contract-diff-view';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FeatureGuard } from '@/components/feature-guard';
import { FinalChecksSidebar } from '@/components/contracts/final-checks-sidebar';
import { EscalateDialog } from '@/components/escalate-dialog';


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
    versions: { id: string; versionNumber: number; createdAt: string; createdBy?: { name: string, id: string } }[];
    approvals: { id: string; type: string; status: string; assignedUser?: { name: string }; createdAt?: string; updatedAt?: string; comment?: string }[];
    attachments: { id: string; fileUrl: string; fileType: string; fileName: string }[];
}

interface ActivityItem {
    id: string;
    type: 'VERSION' | 'AUDIT';
    title: string;
    user: string;
    date: Date;
    meta?: any;
}

// --- sub-components ---
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all relative top-[1px] ${active
            ? 'border-slate-900 text-slate-900'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
    >
        <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
        {label}
    </button>
);

const DetailItem = ({ label, value, icon: Icon, className }: any) => (
    <div className={`flex flex-col gap-1 ${className}`}>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </div>
        <div className="text-sm font-bold text-slate-900 truncate" title={String(value)}>
            {value || 'N/A'}
        </div>
    </div>
);

const VersionCard = ({ version, index, total, onPreview, isLatest }: any) => (
    <div className={`
        relative rounded-xl border p-5 flex flex-col justify-between transition-all group h-full bg-white
        ${isLatest
            ? 'border-orange-200 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100'
            : 'border-slate-200 hover:border-orange-200 hover:shadow-md'
        }
    `}>
        {isLatest && (
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg shadow-sm">
                LATEST
            </div>
        )}

        <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 text-xs font-mono px-2 py-0.5">
                    v{version.versionNumber}
                </Badge>
            </div>

            <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${isLatest ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                    {version.createdBy?.name?.charAt(0) || 'U'}
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[140px]">
                        {version.createdBy?.name || 'Unknown User'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Editor</p>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                <span className="text-slate-300">•</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(version.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-50 flex gap-2">
            <Button
                size="sm"
                variant="ghost"
                className={`flex-1 font-bold text-xs uppercase tracking-wide ${isLatest ? 'text-orange-700 hover:bg-orange-50' : 'text-slate-600 hover:bg-slate-50'}`}
                onClick={() => onPreview(version)}
            >
                <Eye className="w-3.5 h-3.5 mr-2" />
                View
            </Button>
            {!isLatest && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 font-bold text-xs uppercase tracking-wide text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={() => onPreview(version, true)}
                >
                    <GitCompare className="w-3.5 h-3.5 mr-2" />
                    Compare
                </Button>
            )}
        </div>
    </div>
);

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
    };

    const [contract, setContract] = useState<Contract | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'document' | 'history'>('overview');

    // Preview Modal State
    // Preview Modal State
    const [previewVersion, setPreviewVersion] = useState<any | null>(null);
    const [isDiffMode, setIsDiffMode] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [comparisonMode, setComparisonMode] = useState(false);
    const [comparisonVersions, setComparisonVersions] = useState<string[]>([]);
    const [showEscalateDialog, setShowEscalateDialog] = useState(false);

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
                    setAttachmentUrl((contractData as any).attachments[(contractData as any).attachments.length - 1].fileUrl);
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
            } else if (action === 'escalate_to_legal_head') {
                // Open dialog instead of directly escalating
                setShowEscalateDialog(true);
                return; // Don't refresh yet
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

    const handlePreview = async (version: any, diff: boolean = false) => {
        setPreviewVersion(version);
        setIsDiffMode(diff);
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
                user: log.user?.name || 'System', // Audit log should ideally expand user
                date: new Date(log.createdAt),
                meta: log.metadata
            });
        });

        return items.sort((a, b) => b.date.getTime() - a.date.getTime());
    };

    const activityStream = getActivityStream();

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
        <div className="min-h-screen pb-12 bg-slate-50">
            {/* HERO SECTION */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 py-6 space-y-5">
                    {/* 1. Breadcrumbs & Actions */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="max-w-3xl">
                            <nav className="flex items-center text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">
                                <Link href="/dashboard/contracts" className="hover:text-slate-800 transition-colors flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center">
                                        <ArrowLeft className="w-3 h-3" />
                                    </div>
                                    Contracts
                                </Link>
                                <ChevronRight className="w-3 h-3 mx-2 text-slate-300" />
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">{contract.reference || 'REF-???'}</span>
                            </nav>

                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                                {contract.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                    {contract.template?.name || 'Service Agreement'}
                                </Badge>
                                <div className="h-4 w-px bg-slate-200" />
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-50 leading-none to-purple-50 flex items-center justify-center text-[9px] font-bold text-indigo-700 border border-indigo-100 shadow-sm">
                                        {(contract.createdByUser?.name || 'S').charAt(0)}
                                    </div>
                                    Created by <span className="text-slate-900 font-semibold">{contract.createdByUser?.name || 'System'}</span>
                                    <span className="text-slate-400 text-[10px]">on {new Date(contract.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <FeatureGuard feature="AI_CONTRACT_REVIEW">
                                <Button
                                    onClick={() => setIsAnalysisOpen(true)}
                                    variant="outline"
                                    size="sm"
                                    className="h-9 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors font-bold text-xs uppercase tracking-wide shadow-sm"
                                >
                                    <Wand2 className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                                    AI Risk Analysis
                                </Button>
                            </FeatureGuard>
                        </div>
                    </div>


                    {/* REVISION BANNER */}
                    {contract.status === 'REVISION_REQUESTED' && (
                        <div className="relative overflow-hidden bg-rose-50 border border-rose-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-5 shadow-sm">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <AlertTriangle className="w-32 h-32" />
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-rose-600 shadow-sm border border-rose-100 shrink-0">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="flex-1 relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-base font-bold text-slate-900">Changes Requested</h3>
                                    <Badge variant="error" className="bg-rose-600 text-white hover:bg-rose-700 font-bold uppercase tracking-wide text-[10px]">Action Required</Badge>
                                </div>
                                <div className="bg-white/60 rounded-lg p-4 border border-rose-100/50 backdrop-blur-sm">
                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                        &ldquo;{(() => {
                                            const rejection = contract.approvals
                                                ?.filter(a => a.status === 'REJECTED')
                                                .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];
                                            return rejection?.comment?.replace('REVISION REQUESTED: ', '') || 'A reviewer has requested changes to this contract.';
                                        })()}&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Control Bar (Smart Actions) */}
                    <SmartActionButtons
                        contract={contract}
                        permissions={permissions}
                        loading={actionLoading}
                        onAction={handleAction}
                    />

                    {/* 3. Tabs Navigation */}
                    <div className="flex items-center gap-6 pt-4 border-b border-slate-200">
                        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" icon={Briefcase} />
                        <TabButton active={activeTab === 'document'} onClick={() => setActiveTab('document')} label="Document" icon={FileText} />
                        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Version History" icon={History} />
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 py-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                        {/* CONSOLIDATED INFORMATION CARD */}
                        <Card className="shadow-sm border-slate-200 md:col-span-2 hover:shadow-md transition-all duration-300 group overflow-hidden">
                            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                                <CardTitle className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                                        <Info className="w-4 h-4" />
                                    </div>
                                    Contract Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 pb-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Left: General Details */}
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                            General Values
                                        </h4>
                                        <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                                            <DetailItem
                                                label="Contract Value"
                                                value={contract.amount ? formatCurrency(contract.amount) : 'N/A'}
                                                className="col-span-2"
                                            />
                                            <DetailItem
                                                label="Start Date"
                                                value={contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'}
                                                icon={Calendar}
                                            />
                                            <DetailItem
                                                label="End Date"
                                                value={contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}
                                                icon={Clock}
                                            />
                                            <DetailItem
                                                label="Internal Owner"
                                                value={contract.createdByUser?.name || 'Admin'}
                                                icon={User}
                                                className="col-span-2"
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Counterparty */}
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                            Counterparty
                                        </h4>
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative group/card hover:bg-slate-100/80 transition-colors">
                                            <div className="absolute top-4 right-4 text-slate-300">
                                                <Building2 className="w-8 h-8 opacity-20" />
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-slate-800 font-bold shrink-0 border border-slate-200 text-xl shadow-sm">
                                                    {contract.counterpartyName?.charAt(0) || 'C'}
                                                </div>
                                                <div>
                                                    <span className="text-lg font-bold text-slate-900 leading-tight block mb-1">{contract.counterpartyName}</span>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        {contract.counterpartyEmail || 'No email provided'}
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t border-slate-200 mt-2">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-400 font-medium">Tax ID</span>
                                                        <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">{contract.fieldData?.taxId as string || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity Mini with TIMELINE */}
                        <Card className="shadow-sm border-slate-200 md:col-span-2 lg:col-span-1 hover:shadow-md transition-all duration-300 flex flex-col">
                            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
                                <CardTitle className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                                        <History className="w-4 h-4" />
                                    </div>
                                    Activity Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto max-h-[500px] pt-6 pl-4">
                                <div className="space-y-0 relative">
                                    {/* Timeline Line */}
                                    <div className="absolute left-[19px] top-2 bottom-6 w-0.5 bg-slate-100" />

                                    {activityStream.slice(0, 10).map((item, i) => (
                                        <div key={item.id} className="flex gap-4 relative pb-8 last:pb-0 group">
                                            <div className={`
                                                w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-all shadow-sm
                                                bg-white group-hover:scale-105
                                                ${item.type === 'VERSION'
                                                    ? 'border-slate-100 text-slate-500'
                                                    : 'border-white ring-2 ring-indigo-50 text-indigo-600'
                                                }
                                            `}>
                                                {item.type === 'VERSION' ? <FileText className="w-4 h-4" /> : <CheckCircle2 className="w-5 h-5" />}
                                            </div>
                                            <div className="pt-1.5 flex-1">
                                                <p className="text-sm font-medium text-slate-900 leading-snug mb-1">
                                                    <span className="font-bold text-indigo-900">{item.user}</span> {item.title.replace(item.user, '')}
                                                    {item.type === 'VERSION' && (
                                                        <span className="inline-block align-middle font-mono text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded ml-2">v{item.meta?.version}</span>
                                                    )}
                                                </p>
                                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">{item.date.toLocaleDateString()} &bull; {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {activityStream.length === 0 && (
                                        <p className="text-slate-400 text-sm text-center py-4">No activity recorded</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'document' && (
                    <Card className="h-[800px] shadow-lg border-slate-200 animate-in fade-in zoom-in-95 duration-300">
                        <div className="h-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                            {attachmentUrl ? (
                                <iframe src={attachmentUrl} className="w-full h-full border-none" title="Contract PDF" />
                            ) : (
                                <div className="prose prose-slate max-w-[800px] w-full h-full overflow-y-auto bg-white p-12 shadow-sm">
                                    <SafeHtml html={processVariables(contract.content || '', contract)} />
                                    {contract.annexureData && (
                                        <>
                                            <hr className="my-8 border-slate-200" />
                                            <h3 className="text-xl font-bold text-slate-900 mb-4">Annexures</h3>
                                            <SafeHtml html={contract.annexureData} />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {activeTab === 'history' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {comparisonMode && comparisonVersions.length === 2 ? (
                            <VersionDiffViewer
                                contractId={contract.id}
                                fromVersionId={comparisonVersions[0]}
                                toVersionId={comparisonVersions[1]}
                                onBack={() => {
                                    setComparisonMode(false);
                                    setComparisonVersions([]);
                                }}
                            />
                        ) : (
                            <VersionHistoryView
                                contractId={contract.id}
                                onCompare={(v1, v2) => {
                                    setComparisonVersions([v1, v2]);
                                    setComparisonMode(true);
                                }}
                                onRestore={async (id) => {
                                    try {
                                        toast.info('Restoring contract version...');
                                        await api.contracts.restoreVersion(contract.id, id);
                                        toast.success('Contract restored successfully!');
                                        // Ideally refresh data here
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

            {/* PREVIEW MODAL */}
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
                            {isDiffMode ? (
                                <ContractDiffView
                                    oldContent={previewVersion?.contentSnapshot || ''}
                                    newContent={contract.content || ''}
                                    oldVersionLabel={`v${previewVersion?.version}`}
                                    newVersionLabel={`Current`}
                                />
                            ) : (
                                <div className="p-16 prose prose-slate max-w-none">
                                    <SafeHtml html={processVariables((previewVersion?.contentSnapshot || contract.content) + (contract.annexureData || ''), contract)} />
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <FinalChecksSidebar
                contractId={contract.id}
                isOpen={isAnalysisOpen}
                onClose={() => setIsAnalysisOpen(false)}
            />

            <EscalateDialog
                open={showEscalateDialog}
                onOpenChange={setShowEscalateDialog}
                contractId={contract?.id || ''}
                contractTitle={contract?.title || ''}
                onEscalate={handleEscalation}
            />
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
