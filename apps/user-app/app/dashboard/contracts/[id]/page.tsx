'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Spinner, Skeleton } from '@repo/ui';
import { SafeHtml } from '@/components/SafeHtml';
import { useAuth, usePermission } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { api } from '@/lib/api-client';
import {
    ArrowLeft,
    Edit,
    Send,
    Upload,
    FileText,
    CheckCircle,
    Clock,
    FileSignature,
    Download,
    Sparkles,
    History,
    X,
    GitCompare,
    FileDiff,
    Eye,
    ChevronRight,
    Calendar,
    User,
    Mail
} from 'lucide-react';
import { ChangeLogModal } from '@/components/contracts/changelog-modal';

// Status flow for visualization
const statusFlow = [
    { status: 'DRAFT', label: 'Draft', color: 'secondary' },
    { status: 'PENDING_LEGAL', label: 'Legal Review', color: 'warning' },
    { status: 'PENDING_FINANCE', label: 'Finance Review', color: 'warning' },
    { status: 'APPROVED', label: 'Approved', color: 'success' },
    { status: 'SENT_TO_COUNTERPARTY', label: 'Sent', color: 'info' },
    { status: 'ACTIVE', label: 'Active', color: 'success' },
];

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
}

function ContractDetailContent() {
    const params = useParams();
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const canEdit = usePermission('contract:edit');
    const canSubmit = usePermission('contract:submit');
    const canSend = usePermission('contract:send');

    const [contract, setContract] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [showChangelog, setShowChangelog] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<any>(null);

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const data = await api.contracts.get(params.id as string);
                setContract(data as Contract);
            } catch (err) {
                console.error('Failed to fetch contract:', err);
                toastError('Error', 'Failed to load contract');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContract();
    }, [params.id, toastError]);

    const handleSubmit = async () => {
        if (!contract) return;
        setActionLoading(true);
        try {
            await api.contracts.submit(contract.id);
            success('Submitted', 'Contract submitted for approval');
            const data = await api.contracts.get(contract.id);
            setContract(data as Contract);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to submit';
            toastError('Error', msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSend = async () => {
        if (!contract) return;
        setActionLoading(true);
        try {
            await api.contracts.send(contract.id);
            success('Sent', 'Contract sent to counterparty');
            const data = await api.contracts.get(contract.id);
            setContract(data as Contract);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to send';
            toastError('Error', msg);
        } finally {
            setActionLoading(false);
        }
    };

    // Hidden file input ref
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !contract) return;

        // Reset input value so same file can be selected again if needed
        e.target.value = '';

        setActionLoading(true);
        try {
            // Validate file type
            if (file.type !== 'application/pdf') {
                throw new Error('Please upload a valid PDF file');
            }

            await api.contracts.uploadSigned(contract.id, file);
            success('Active', 'Contract signed and activated');
            const data = await api.contracts.get(contract.id);
            setContract(data as Contract);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to upload';
            toastError('Error', msg);
        } finally {
            setActionLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 pt-4">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-4">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-[600px] w-full rounded-xl" />
                    </div>
                    <div className="col-span-1 space-y-4">
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
                    <FileText className="w-12 h-12 text-neutral-400" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Contract Not Found</h2>
                <p className="text-neutral-500 mb-8 max-w-md">The contract you are looking for might have been deleted or you may not have permission to view it.</p>
                <Link href="/dashboard/contracts">
                    <Button variant="default" className="bg-neutral-900 text-white hover:bg-neutral-800">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Contracts
                    </Button>
                </Link>
            </div>
        );
    }

    const currentStepIndex = statusFlow.findIndex((s) => s.status === contract.status);

    return (
        <div className="min-h-[calc(100vh-100px)] pb-12">
            {/* Breadcrumb & Header */}
            <div className="mb-8 sticky top-0 z-30 bg-neutral-50/95 backdrop-blur py-4 border-b border-neutral-200/50 -mx-6 px-6 sm:-mx-8 sm:px-8">
                <div className="max-w-[1600px] mx-auto">
                    <nav className="flex items-center text-sm text-neutral-500 mb-3">
                        <Link href="/dashboard/contracts" className="hover:text-neutral-900 transition-colors">Contracts</Link>
                        <ChevronRight className="w-4 h-4 mx-1.5 text-neutral-400" />
                        <span className="font-medium text-neutral-900 truncate max-w-[300px]">{contract.title}</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-neutral-900 truncate">{contract.title}</h1>
                            <Badge variant={statusColors[contract.status]} className="h-6 px-2.5 shadow-none border">
                                {contract.status.replace(/_/g, ' ')}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            {contract.status === 'DRAFT' && canEdit && (
                                <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                                    <Button variant="outline" className="shadow-sm bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700 font-medium">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Content
                                    </Button>
                                </Link>
                            )}
                            {contract.status === 'DRAFT' && canSubmit && (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={actionLoading}
                                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 font-medium"
                                >
                                    {actionLoading ? <Spinner size="sm" className="mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    Submit for Approval
                                </Button>
                            )}
                            {contract.status === 'APPROVED' && canSend && (
                                <Button
                                    onClick={handleSend}
                                    disabled={actionLoading}
                                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20"
                                >
                                    {actionLoading ? <Spinner size="sm" className="mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    Send to Counterparty
                                </Button>
                            )}
                            {contract.status === 'SENT_TO_COUNTERPARTY' && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="application/pdf"
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        onClick={handleUploadClick}
                                        disabled={actionLoading}
                                        className="bg-success hover:bg-success-dark text-white shadow-lg shadow-success/20"
                                    >
                                        {actionLoading ? <Spinner size="sm" className="mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                        Upload Signed PDF
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Lifecycle Progress Stepper */}
            <div className="max-w-[1600px] mx-auto mb-8">
                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm overflow-x-auto">
                    <div className="flex items-center justify-between relative min-w-[600px] lg:min-w-0">
                        {/* Connecting Line background */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-100 -z-0"></div>

                        {statusFlow.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={step.status} className="relative z-10 flex flex-col items-center bg-white px-2">
                                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCurrent
                                        ? 'border-orange-600 bg-orange-50 text-orange-600 ring-4 ring-orange-100 scale-110 shadow-lg'
                                        : isCompleted
                                            ? 'border-orange-600 bg-orange-600 text-white shadow-md'
                                            : 'border-neutral-200 bg-white text-neutral-300'
                                        }`}>
                                        {isCompleted && !isCurrent ? (
                                            <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                                        ) : (
                                            <span className="text-xs lg:text-sm font-bold">{index + 1}</span>
                                        )}
                                    </div>
                                    <span className={`mt-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider text-center max-w-[80px] leading-tight ${isCurrent
                                        ? 'text-orange-700'
                                        : isCompleted
                                            ? 'text-orange-600'
                                            : 'text-neutral-400'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Document Canvas */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Document Container */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden min-h-[800px] relative group">
                        {/* Paper Texture / Background */}
                        <div className="absolute inset-0 bg-neutral-50/50 pointer-events-none" />

                        {/* Header Bar within Document */}
                        <div className="relative border-b border-neutral-100 bg-white px-8 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-neutral-400">
                                <FileText className="w-4 h-4" />
                                <span className="text-xs font-mono uppercase tracking-wider">Document Preview</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading}
                                onClick={async () => {
                                    setActionLoading(true);
                                    try {
                                        const html2pdf = (await import('html2pdf.js')).default;
                                        const element = document.getElementById('contract-content-view');
                                        if (!element) return;

                                        const opt = {
                                            margin: [10, 10, 10, 10],
                                            filename: `${contract.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
                                            image: { type: 'jpeg', quality: 0.98 },
                                            pagebreak: { mode: ['css', 'legacy'] },
                                            html2canvas: {
                                                scale: 2,
                                                useCORS: true,
                                                onclone: (clonedDoc: Document) => {
                                                    const allElements = clonedDoc.querySelectorAll('*');
                                                    allElements.forEach((el) => {
                                                        const htmlEl = el as HTMLElement;
                                                        const style = getComputedStyle(htmlEl);

                                                        // 1. Remove shadows and borders from pages to make them look seamless in PDF
                                                        if (htmlEl.classList.contains('shadow-sm') || htmlEl.classList.contains('md:shadow-xl')) {
                                                            htmlEl.style.boxShadow = 'none';
                                                            htmlEl.style.border = 'none';
                                                            htmlEl.style.marginBottom = '0'; // Remove gap between pages
                                                        }

                                                        // Remove the main wrapper gap
                                                        if (htmlEl.id === 'contract-content-view') {
                                                            htmlEl.style.gap = '0';
                                                        }

                                                        // 2. Aggressive oklch replacement
                                                        const bg = style.backgroundColor;
                                                        if (bg && bg.includes('oklch')) {
                                                            htmlEl.style.backgroundColor = '#ffffff';
                                                        }
                                                        const color = style.color;
                                                        if (color && color.includes('oklch')) {
                                                            htmlEl.style.color = '#0f172a';
                                                        }
                                                        const border = style.borderColor;
                                                        if (border && border.includes('oklch')) {
                                                            htmlEl.style.borderColor = '#e2e8f0';
                                                        }
                                                    });
                                                }
                                            },
                                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                        };

                                        // @ts-ignore
                                        await html2pdf().set(opt).from(element).save();
                                        success('Downloaded', 'PDF downloaded successfully');
                                    } catch (err) {
                                        console.error('Download failed', err);
                                        toastError('Error', 'Failed to generate PDF');
                                    } finally { setActionLoading(false); }
                                }}
                                className="text-neutral-500 hover:text-neutral-900"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                        </div>

                        {/* Actual Content - A4 Ratio Wrapper */}
                        <div className="relative p-8 md:p-12 lg:p-16 bg-neutral-100/50 min-h-[800px] flex flex-col items-center gap-8">
                            <div id="contract-content-view" className="w-full max-w-[750px] mx-auto flex flex-col gap-8 print:block print:gap-0">

                                <style jsx global>{`
                                    /* Table Borders for Preview */
                                    .prose table {
                                        width: 100%;
                                        border-collapse: collapse;
                                        margin-top: 1em;
                                        margin-bottom: 1em;
                                    }
                                    .prose td, .prose th {
                                        border: 1px solid #cbd5e1;
                                        padding: 8px 12px;
                                    }
                                    .prose th {
                                        background-color: #f8fafc;
                                        font-weight: 600;
                                    }
                                `}</style>

                                {(() => {
                                    // Variable placement logic
                                    const processVariables = (htmlContent: string, data: any) => {
                                        if (!htmlContent) return "";

                                        const replacer = (key: string) => {
                                            if (!key) return "";
                                            switch (key) {
                                                case 'counterpartyName': return data.counterpartyName || '<span class="text-red-500">[Client Name]</span>';
                                                case 'counterpartyEmail': return data.counterpartyEmail || '<span class="text-red-500">[Client Email]</span>';
                                                case 'contractTitle': // Fallthrough
                                                case 'title': return data.title || '[Contract Title]';
                                                case 'amount': return data.amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(data.amount)) : '<span class="text-red-500">[Amount]</span>';
                                                case 'startDate': return data.startDate ? new Date(data.startDate).toLocaleDateString() : '<span class="text-red-500">[Start Date]</span>';
                                                case 'endDate': return data.endDate ? new Date(data.endDate).toLocaleDateString() : '<span class="text-red-500">[End Date]</span>';
                                                default: return "";
                                            }
                                        };

                                        let processed = htmlContent;

                                        // 1. Match legacy format: <span data-variable="key">Label</span>
                                        processed = processed.replace(/<span[^>]*data-variable="([^"]+)"[^>]*>.*?<\/span>/g, (match, key) => {
                                            return replacer(key) || match;
                                        });

                                        // 2. Match TipTap node format: Any span with data-type="variable"
                                        // We capture the attributes string to extract ID safely regardless of order
                                        processed = processed.replace(/<span([^>]*data-type="variable"[^>]*)>.*?<\/span>/g, (match, attrs) => {
                                            const idMatch = attrs.match(/id="([^"]+)"/);
                                            const key = idMatch ? idMatch[1] : null;
                                            return key ? (replacer(key) || match) : match;
                                        });

                                        return processed;
                                    };

                                    const processedContent = processVariables(contract.annexureData, contract);

                                    return processedContent && processedContent.split(/<div\s+style="[^"]*page-break-before:\s*always[^"]*"[^>]*>[\s\S]*?<\/div>/gi)
                                        .filter(content => {
                                            if (!content) return false;
                                            const textOnly = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                                            const hasStructure = /<(img|table|hr|iframe|video)/i.test(content);
                                            return textOnly.length > 0 || hasStructure;
                                        })
                                        .map((pageContent, index) => (
                                            <div
                                                key={index}
                                                className={`bg-white shadow-sm md:shadow-xl border border-neutral-200/50 print:border-none print:shadow-none min-h-[1000px] relative group p-12 md:p-16 ${index > 0 ? 'page-break-before-always' : ''}`}
                                                style={index > 0 ? { pageBreakBefore: 'always' } : {}}
                                            >
                                                {/* Paper Texture/Header Effect - Only on first page */}
                                                {index === 0 && (
                                                    <>
                                                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 opacity-90 rounded-t-sm" />
                                                        <div className="mb-12 pb-8 border-b border-neutral-100">
                                                            <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-4">{contract.title}</h1>
                                                            <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600">
                                                                <div>
                                                                    <span className="text-neutral-400 block text-xs uppercase tracking-wide mb-1">Reference</span>
                                                                    <span className="font-mono">{contract.reference}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-neutral-400 block text-xs uppercase tracking-wide mb-1">Date</span>
                                                                    <span>{new Date(contract.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                <SafeHtml
                                                    className="prose prose-neutral max-w-none font-serif leading-relaxed text-neutral-800"
                                                    html={pageContent}
                                                />

                                                {/* Pagination/Footer hint */}
                                                <div className="absolute bottom-4 right-8 text-[10px] text-neutral-300 font-mono select-none">
                                                    PAGE {index + 1}
                                                </div>
                                            </div>
                                        ))
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sticky Sidebar */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Metadata Card */}
                    <Card className="border-neutral-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-neutral-100">
                            <CardTitle className="text-base font-semibold">Contract Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-neutral-500" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Counterparty</p>
                                    <p className="font-medium text-neutral-900 truncate" title={contract.counterpartyName || ''}>{contract.counterpartyName || 'Not specified'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-neutral-500" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Contact Email</p>
                                    <p className="font-medium text-neutral-900 truncate" title={contract.counterpartyEmail || ''}>{contract.counterpartyEmail || '-'}</p>
                                </div>
                            </div>

                            {contract.amount !== undefined && contract.amount !== null && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-bold text-neutral-600">₹</span>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Contract Value</p>
                                        <p className="font-medium text-neutral-900 truncate">
                                            {formatCurrency(contract.amount)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {(contract.startDate || contract.endDate) && (
                                    <>
                                        {contract.startDate && (
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                                    <Calendar className="w-4 h-4 text-neutral-500" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Effective</p>
                                                    <p className="font-medium text-neutral-900">{new Date(contract.startDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                        {contract.endDate && (
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                                    <Clock className="w-4 h-4 text-neutral-500" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Expires</p>
                                                    <p className="font-medium text-neutral-900">{new Date(contract.endDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                    <FileSignature className="w-4 h-4 text-neutral-500" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Template</p>
                                    <p className="font-medium text-neutral-900 truncate">{contract.template.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                    <div className="w-4 h-4 rounded-full bg-neutral-300 flex items-center justify-center text-[10px] text-white font-bold">
                                        {contract.createdByUser.name.charAt(0)}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Created By</p>
                                    <p className="font-medium text-neutral-900 truncate">
                                        {contract.createdByUser.name}
                                    </p>
                                    <p className="text-xs text-neutral-400">{new Date(contract.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Approvals Card */}
                    <Card className="border-neutral-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50">
                            <CardTitle className="text-base font-semibold flex items-center justify-between">
                                Approvals
                                {contract.approvals.length > 0 && (
                                    <span className="text-xs font-normal text-neutral-500 bg-white px-2 py-0.5 rounded-full border border-neutral-200">{contract.approvals.length}</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {contract.approvals.length === 0 ? (
                                <div className="p-6 text-center text-neutral-500 text-sm">
                                    No approvals required yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-100">
                                    {contract.approvals.map((approval) => (
                                        <div key={approval.id} className="p-3 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${approval.status === 'APPROVED' ? 'bg-success' :
                                                    approval.status === 'REJECTED' ? 'bg-error' : 'bg-warning'
                                                    }`} />
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900">{approval.type === 'LEGAL' ? 'Legal Team' : 'Finance Team'}</p>
                                                    <p className="text-xs text-neutral-500">{approval.assignedUser?.name || 'Unassigned'}</p>
                                                </div>
                                            </div>
                                            <Badge variant={
                                                approval.status === 'APPROVED' ? 'success' :
                                                    approval.status === 'REJECTED' ? 'error' : 'warning'
                                            } className="text-[10px] h-5 px-1.5">
                                                {approval.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Risk Analysis Banner */}
                    <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg relative overflow-hidden group cursor-pointer"
                        onClick={() => router.push(`/dashboard/contracts/${contract.id}/analysis`)}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-indigo-200" />
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">AI Insights</span>
                            </div>
                            <h3 className="text-lg font-bold mb-1">Risk Analysis</h3>
                            <p className="text-sm text-indigo-100 mb-3 line-clamp-2">View AI-generated risk assessment and clause recommendations.</p>
                            <Button size="sm" variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none">
                                View Analysis
                            </Button>
                        </div>
                    </div>

                    {/* Version History Quick Link */}
                    <Card className="border-neutral-200 shadow-sm cursor-pointer hover:border-neutral-300 transition-colors"
                        onClick={() => setShowChangelog(true)}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                                    <History className="w-4 h-4 text-neutral-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-900">Version History</p>
                                    <p className="text-xs text-neutral-500">{contract.versions.length} version{contract.versions.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </CardContent>
                    </Card>

                    <ChangeLogModal
                        open={showChangelog}
                        onOpenChange={setShowChangelog}
                        versionId={selectedVersion?.id || null}
                        contractId={contract.id}
                        versions={contract.versions}
                        onVersionSelect={(vId) => {
                            const v = contract.versions.find((VER: any) => VER.id === vId);
                            setSelectedVersion(v);
                        }}
                    />
                </div >
            </div >
        </div >
    );
}

export default function ContractDetailPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
            <ContractDetailContent />
        </Suspense>
    );
}
