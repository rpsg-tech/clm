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
    Wand2,
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
    content?: string; // Add content field
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
    // ... [No changes to hooks] ...
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
                setContract(data as any); // Cast to any to align with new fields if needed
            } catch (err) {
                console.error('Failed to fetch contract:', err);
                toastError('Error', 'Failed to load contract');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContract();
    }, [params.id, toastError]);

    // ... [No changes to handlers] ...
    const handleSubmit = async () => {
        if (!contract) return;
        setActionLoading(true);
        try {
            await api.contracts.submit(contract.id);
            success('Submitted', 'Contract submitted for approval');
            const data = await api.contracts.get(contract.id);
            setContract(data as any);
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
            setContract(data as any);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to send';
            toastError('Error', msg);
        } finally {
            setActionLoading(false);
        }
    };

    // Helper: Process Variables
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
        // 1. Legacy format
        processed = processed.replace(/<span[^>]*data-variable="([^"]+)"[^>]*>.*?<\/span>/g, (match, key) => (replacer(key) || match));
        // 2. TipTap legacy
        processed = processed.replace(/<span([^>]*data-type="variable"[^>]*)>.*?<\/span>/g, (match, attrs) => {
            const idMatch = attrs.match(/id="([^"]+)"/);
            const key = idMatch ? idMatch[1] : null;
            return key ? (replacer(key) || match) : match;
        });
        return processed;
    };

    const handleDownloadPdf = async () => {
        if (!contract) return;
        setActionLoading(true);
        try {
            // 1. Prepare Content
            const mainContent = processVariables(contract.content || '', contract);
            const annexureContent = processVariables(contract.annexureData || '', contract);

            // 2. Construct Complete HTML Document for Server-Side Rendering
            // We include the full HTML shell to ensure styles are applied correctly in the headless browser
            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>${contract.title}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                        
                        /* A4 Page Formatting - Matched to PDF Service Margins */
                        @page {
                            margin: 20mm 15mm;
                            size: A4 portrait;
                        }
                        
                        /* Stamp Paper Support: First page has larger top margin (approx 5 inches) */
                        @page :first {
                            margin-top: 125mm;
                        }

                        body {
                            font-family: 'Times New Roman', serif;
                            font-size: 12pt;
                            line-height: 1.5;
                            color: #000000;
                            margin: 0;
                            padding: 0;
                        }

                        /* Typography & Layout */
                        .contract-pdf-wrapper {
                            text-align: justify;
                            width: 100%;
                            background: white;
                        }

                        /* Headings */
                        h1, h2, h3, h4, h5, h6 {
                            font-weight: bold;
                            margin-top: 1.5em;
                            margin-bottom: 0.8em;
                            page-break-after: avoid; 
                            break-after: avoid;
                        }
                        
                        h1 { font-size: 18pt; text-align: center; text-transform: uppercase; margin-bottom: 24px; }
                        h2 { font-size: 16pt; border-bottom: 1px solid #eee; padding-bottom: 8px; }
                        h3 { font-size: 14pt; }

                        /* Paragraphs */
                        p {
                            margin-bottom: 1em;
                            orphans: 3;
                            widows: 3;
                        }

                        /* Tables */
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 1.5em 0;
                            font-size: 11pt;
                        }
                        th, td {
                            border: 1px solid #000;
                            padding: 8px;
                            text-align: left;
                            vertical-align: top;
                            page-break-inside: avoid;
                        }
                        th { background-color: #f3f3f3; font-weight: bold; }

                        /* Section Specifics */
                        .main-section { margin-bottom: 0; padding-bottom: 0; }
                        .annexure-section { margin-top: 0; padding-top: 20px; }
                        
                        /* Explicit Page Break Class */
                        .page-break {
                            page-break-before: always;
                        }
                    </style>
                </head>
                <body>
                    <div class="contract-pdf-wrapper">
                        <!-- Main Agreement -->
                        <div class="main-section">
                            ${mainContent}
                        </div>

                        <!-- Annexures -->
                        ${annexureContent ? `
                            <div class="page-break"></div>
                            <div class="annexure-section">
                                ${annexureContent}
                            </div>
                        ` : ''}
                    </div>
                </body>
                </html>
            `;

            // 3. Call Serverless PDF Endpoint
            const response = await fetch('/api/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: fullHtml }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to generate PDF on server');
            }

            // 4. Handle File Download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${contract.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            success('Downloaded', 'PDF generated successfully');

        } catch (err) {
            console.error('PDF Generation Error:', err);
            const msg = err instanceof Error ? err.message : 'Failed to generate PDF';
            toastError('Error', msg);
        } finally {
            setActionLoading(false);
        }
    };

    // Hidden file input ref (moved down)
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
            setContract(data as any);
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
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                    <FileText className="w-12 h-12 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Contract Not Found</h2>
                <p className="text-slate-500 mb-8 max-w-md">The contract you are looking for might have been deleted or you may not have permission to view it.</p>
                <Link href="/dashboard/contracts">
                    <Button variant="default" className="bg-slate-900 text-white hover:bg-slate-800">
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
            <div className="mb-8 relative bg-slate-50/50 backdrop-blur-sm py-6 border-b border-slate-200/60 -mx-6 px-6 sm:-mx-8 sm:px-8 sticky top-0 z-20">
                <div className="max-w-[1600px] mx-auto">
                    <nav className="flex items-center text-sm text-slate-500 mb-3 font-medium">
                        <Link href="/dashboard/contracts" className="hover:text-slate-900 transition-colors">Contracts</Link>
                        <ChevronRight className="w-4 h-4 mx-1.5 text-slate-400" />
                        <span className="text-slate-900 truncate max-w-[300px]">{contract.title}</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-slate-900 truncate tracking-tight">{contract.title}</h1>
                            <Badge variant={statusColors[contract.status]} className="h-7 px-3 text-xs font-bold shadow-sm border uppercase tracking-wider">
                                {contract.status.replace(/_/g, ' ')}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            {contract.status === 'DRAFT' && canEdit && (
                                <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                                    <Button variant="outline" className="shadow-sm bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wide h-9">
                                        <Edit className="w-3.5 h-3.5 mr-2" />
                                        Edit Content
                                    </Button>
                                </Link>
                            )}
                            {contract.status === 'DRAFT' && canSubmit && (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={actionLoading}
                                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 font-bold text-xs uppercase tracking-wide h-9 px-6"
                                >
                                    {actionLoading ? <Spinner size="sm" className="mr-2" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                                    Submit for Review
                                </Button>
                            )}
                            {contract.status === 'APPROVED' && canSend && (
                                <Button
                                    onClick={handleSend}
                                    disabled={actionLoading}
                                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 font-bold text-xs uppercase tracking-wide h-9 px-6"
                                >
                                    {actionLoading ? <Spinner size="sm" className="mr-2" /> : <Send className="w-3.5 h-3.5 mr-2" />}
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
                                        className="bg-success hover:bg-success-dark text-white shadow-lg shadow-success/20 font-bold text-xs uppercase tracking-wide h-9 px-6"
                                    >
                                        {actionLoading ? <Spinner size="sm" className="mr-2" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
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
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm overflow-x-auto">
                    <div className="flex items-center justify-between relative min-w-[600px] lg:min-w-0">
                        {/* Connecting Line background */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-0 rounded-full"></div>

                        {statusFlow.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={step.status} className="relative z-10 flex flex-col items-center bg-white px-3">
                                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCurrent
                                        ? 'border-orange-600 bg-orange-50 text-orange-600 ring-4 ring-orange-100 scale-110 shadow-lg'
                                        : isCompleted
                                            ? 'border-orange-600 bg-orange-600 text-white shadow-md'
                                            : 'border-slate-200 bg-white text-slate-300'
                                        }`}>
                                        {isCompleted && !isCurrent ? (
                                            <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                                        ) : (
                                            <span className="text-xs lg:text-sm font-bold">{index + 1}</span>
                                        )}
                                    </div>
                                    <span className={`mt-4 text-[10px] lg:text-xs font-bold uppercase tracking-wider text-center max-w-[100px] leading-tight transition-colors duration-300 ${isCurrent
                                        ? 'text-orange-700'
                                        : isCompleted
                                            ? 'text-orange-600'
                                            : 'text-slate-400'
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
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[800px] relative group">
                        {/* Paper Texture / Background */}
                        <div className="absolute inset-0 bg-slate-50/50 pointer-events-none" />

                        {/* Header Bar within Document */}
                        <div className="relative border-b border-slate-100 bg-white px-8 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400">
                                <FileText className="w-4 h-4" />
                                <span className="text-xs font-mono uppercase tracking-wider">Document Preview</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading}
                                onClick={handleDownloadPdf}
                                className="text-slate-500 hover:text-slate-900"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Download PDF</span>
                            </Button>
                        </div>

                        {/* Actual Content - A4 Ratio Wrapper */}
                        <div className="relative p-8 md:p-12 lg:p-16 bg-slate-100/50 min-h-[800px] flex flex-col items-center gap-8">
                            {/* PREVIEW ONLY - Does NOT affect PDF Gen anymore */}
                            <div id="contract-content-view-preview" className="w-full max-w-[750px] mx-auto flex flex-col gap-8">
                                {(() => {
                                    // Reuse processing for preview
                                    const mainContent = processVariables(contract.content || '', contract);
                                    const annexureContent = processVariables(contract.annexureData || '', contract);
                                    const stitchedContent = (mainContent && annexureContent)
                                        ? `${mainContent}<div class="preview-page-break"></div>${annexureContent}`
                                        : (mainContent || annexureContent);

                                    // Simple Preview Render
                                    return (
                                        <div className="bg-white shadow-sm md:shadow-xl border border-slate-200/50 relative px-12 md:px-16 pb-12 md:pb-16 pt-[480px] min-h-[1000px]">
                                            <SafeHtml className="prose prose-slate max-w-none font-serif leading-relaxed text-slate-800 text-justify" html={stitchedContent} />
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Styles for Preview ONLY (PDF uses internal styles now) */}
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
                    .prose h1 {
                        text-align: center;
                        text-transform: uppercase;
                    }
                    .preview-page-break { 
                        border-top: 2px dashed #e5e5e5; 
                        margin: 40px 0; 
                        position: relative; 
                    }
                    .preview-page-break::after { 
                        content: 'Page Break'; 
                        position: absolute; 
                        top: -10px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        background: #f5f5f5; 
                        padding: 0 10px; 
                        color: #999; 
                        font-size: 10px; 
                    }
                `}</style>

                {/* Right Column: Sticky Sidebar */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Metadata Card */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-semibold">Contract Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Counterparty</p>
                                    <p className="font-medium text-slate-900 truncate" title={contract.counterpartyName || ''}>{contract.counterpartyName || 'Not specified'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Contact Email</p>
                                    <p className="font-medium text-slate-900 truncate" title={contract.counterpartyEmail || ''}>{contract.counterpartyEmail || '-'}</p>
                                </div>
                            </div>

                            {contract.amount !== undefined && contract.amount !== null && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-bold text-slate-600">₹</span>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Contract Value</p>
                                        <p className="font-medium text-slate-900 truncate">
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
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Calendar className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Effective</p>
                                                    <p className="font-medium text-slate-900">{new Date(contract.startDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                        {contract.endDate && (
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Clock className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Expires</p>
                                                    <p className="font-medium text-slate-900">{new Date(contract.endDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <FileSignature className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Template</p>
                                    <p className="font-medium text-slate-900 truncate">{contract.template.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <div className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[10px] text-white font-bold">
                                        {contract.createdByUser.name.charAt(0)}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Created By</p>
                                    <p className="font-medium text-slate-900 truncate">
                                        {contract.createdByUser.name}
                                    </p>
                                    <p className="text-xs text-slate-400">{new Date(contract.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Approvals Card */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-semibold flex items-center justify-between">
                                Approvals
                                {contract.approvals.length > 0 && (
                                    <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{contract.approvals.length}</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {contract.approvals.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 text-sm">
                                    No approvals required yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {contract.approvals.map((approval) => (
                                        <div key={approval.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${approval.status === 'APPROVED' ? 'bg-success' :
                                                    approval.status === 'REJECTED' ? 'bg-error' : 'bg-warning'
                                                    }`} />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{approval.type === 'LEGAL' ? 'Legal Team' : 'Finance Team'}</p>
                                                    <p className="text-xs text-slate-500">{approval.assignedUser?.name || 'Unassigned'}</p>
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
                    <div className="rounded-xl p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group cursor-pointer border border-slate-700/50"
                        onClick={() => router.push(`/dashboard/contracts/${contract.id}/analysis`)}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Wand2 className="w-32 h-32 -mr-8 -mt-8 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                    <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200">AI Risk Analysis</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2 tracking-tight">Contract Insights</h3>
                            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                                View AI-generated risk assessment and clause recommendations for this contract.
                            </p>
                            <Button size="sm" variant="secondary" className="w-full bg-white text-slate-900 hover:bg-orange-50 hover:text-orange-700 border-none font-bold text-xs uppercase tracking-wide h-9 shadow-lg">
                                View Analysis
                            </Button>
                        </div>
                    </div>

                    {/* Version History Quick Link */}
                    <Card className="border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                        onClick={() => setShowChangelog(true)}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <History className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Version History</p>
                                    <p className="text-xs text-slate-500">{contract.versions.length} version{contract.versions.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
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
