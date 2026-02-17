"use client";

import { useState } from "react";
import { Download, ArrowRight, FileCheck, Calendar, User, IndianRupee, FileText, Sparkles, Upload, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ContractAssistantSidebar } from "./contract-assistant-sidebar";

interface FinalReviewViewProps {
    content: string;
    details: any;
    templateName?: string;
    filePreviewUrl?: string | null;
    onSubmit: () => void;
    onBackToEdit?: () => void;
    onReject?: (comment: string) => void;
    loading: boolean;
    className?: string;
    isAiOpen?: boolean;
    onToggleAi?: (open: boolean) => void;
    contractId?: string;
    onUploadSignedCopy?: () => void;
}

export function FinalReviewView({
    content,
    details,
    templateName,
    filePreviewUrl,
    onSubmit,
    onBackToEdit,
    onReject,
    loading,
    className = "",
    isAiOpen = false,
    onToggleAi,
    contractId,
    onUploadSignedCopy
}: FinalReviewViewProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const { hasPermission } = useAuth();

    // ... handleDownload remains same ...
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            if (filePreviewUrl) {
                const a = document.createElement('a');
                a.href = filePreviewUrl;
                a.download = `${(details.title || 'contract').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_preview`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return;
            }

            const processedHtml = processVariables(content, details);
            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>${details.title || 'Contract'}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                        @page { margin: 20mm 15mm; size: A4 portrait; }
                        @page :first { margin-top: 125mm; }
                        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
                        .contract-pdf-wrapper { text-align: justify; width: 100%; background: white; }
                        h1, h2, h3, h4, h5, h6 { font-weight: bold; margin-top: 1.5em; margin-bottom: 0.8em; page-break-after: avoid; }
                        h1 { font-size: 18pt; text-align: center; text-transform: uppercase; margin-bottom: 24px; }
                        h2 { font-size: 16pt; border-bottom: 1px solid #eee; padding-bottom: 8px; }
                        p { margin-bottom: 1em; }
                        table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 11pt; }
                        th, td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: top; page-break-inside: avoid; }
                        th { background-color: #f3f3f3; font-weight: bold; }
                        .page-break { page-break-before: always; }
                    </style>
                </head>
                <body>
                    <div class="contract-pdf-wrapper">
                        ${processedHtml}
                    </div>
                </body>
                </html>
            `;

            const response = await fetch('/api/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: fullHtml }),
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(details.title || 'contract').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('PDF Download failed:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const processVariables = (htmlContent: string, data: any) => {
        if (!htmlContent) return "";
        const replacer = (key: string) => {
            const normalizedKey = key.trim();
            const lookupKey = normalizedKey === 'Client Name' ? 'counterpartyName' :
                normalizedKey === 'Client Email' ? 'counterpartyEmail' :
                    normalizedKey === 'Business Name' ? 'counterpartyBusinessName' :
                        normalizedKey === 'Contract Title' ? 'title' : normalizedKey;
            const val = data[lookupKey] || data[normalizedKey];
            if (val) {
                if (lookupKey === 'amount') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
                if (lookupKey === 'startDate' || lookupKey === 'endDate') return new Date(val).toLocaleDateString();
                return val;
            }
            return `<span class="bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200 font-mono text-xs">{{${normalizedKey}}}</span>`;
        };
        let processed = htmlContent;
        processed = processed.replace(/<span[^>]*data-variable="([^"]+)"[^>]*>.*?<\/span>/g, (match, key) => {
            const val = replacer(key);
            return val.includes('{{') ? match : val;
        });
        processed = processed.replace(/<span[^>]*data-type="variable"[^>]*>.*?<\/span>/g, (match, attrs) => {
            const idMatch = match.match(/id="([^"]+)"/);
            const key = idMatch ? idMatch[1] : null;
            if (key) {
                const val = replacer(key);
                return val.includes('{{') ? match : val;
            }
            return match;
        });
        processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, key) => replacer(key));
        return processed;
    };

    const processedContent = processVariables(content, details);

    const MetaDataRow = ({ label, value, icon: Icon }: { label: string, value: string | React.ReactNode, icon?: any }) => (
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2">
                {Icon && <Icon size={12} className="text-slate-400" />}
                <span className="text-[11px] font-semibold text-slate-500">{label}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[160px]">{value}</span>
        </div>
    );

    return (
        <div className={cn("flex h-full w-full bg-slate-50 relative", className)}>

            {/* LEFT SIDEBAR: Details & Actions */}
            <div className="w-[340px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 h-full">
                {/* Header removed for space */}

                {/* Content Area */}
                <div className="px-4 py-3 space-y-4">
                    {/* 1. Contract Identity */}
                    <div className="space-y-3 pt-2">
                        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                            <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                                {details.title || "Untitled Contract"}
                            </h3>
                            {templateName && (
                                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-white text-slate-600 text-[10px] font-semibold border border-slate-200">
                                    {templateName}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Parties Involved */}
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] px-1">Engagement details</h4>
                        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                            <MetaDataRow
                                icon={User}
                                label="Business Entity"
                                value={details.counterpartyBusinessName || "N/A"}
                            />
                            <MetaDataRow
                                icon={User}
                                label="Point of Contact"
                                value={details.counterpartyName || "N/A"}
                            />
                        </div>
                    </div>

                    {/* 3. Key Financials & Terms */}
                    <div className="space-y-2 pb-4">
                        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] px-1">Commercial terms</h4>
                        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                            <MetaDataRow
                                icon={IndianRupee}
                                label="Contract Value"
                                value={details.amount ? `₹${Number(details.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : "-"}
                            />
                            <MetaDataRow
                                icon={Calendar}
                                label="Start Date"
                                value={details.startDate ? new Date(details.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                            />
                            <MetaDataRow
                                icon={Calendar}
                                label="Expiry Date"
                                value={details.endDate ? new Date(details.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex items-center gap-2">
                        {onBackToEdit && (
                            <button
                                onClick={onBackToEdit}
                                className="relative group px-3 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center"
                                aria-label="Back to Edit"
                            >
                                <ArrowRight size={12} className="rotate-180" />
                                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                                    Back to Edit
                                </span>
                            </button>
                        )}
                        <button
                            onClick={onSubmit}
                            disabled={loading}
                            className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all duration-200 flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : (
                                <>
                                    Finalise Draft <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="relative group px-3 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center"
                            aria-label="Download contract"
                        >
                            {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                                Download
                            </span>
                        </button>
                    </div>
                </div>

            </div>

            {/* Dialogs */}

            {/* MAIN CONTENT: Document Workspace */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-200/50">
                {/* WORKSPACE HEADER with AI TOGGLE */}
                <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <FileText className="w-3.5 h-3.5" />
                            Document Preview
                        </div>
                    </div>

                    <button
                        onClick={() => onToggleAi?.(!isAiOpen)}
                        className={`text-sm font-bold flex items-center gap-2 transition-all duration-200 ${isAiOpen ? 'text-orange-600' : 'text-slate-400 hover:text-orange-500'}`}
                    >
                        <Sparkles className={`w-4 h-4 ${isAiOpen ? 'fill-orange-600/10' : ''}`} />
                        AI Assistant
                    </button>
                </div>

                <div className="flex-1 flex min-h-0 overflow-hidden relative">
                    <div className={`flex-1 overflow-y-auto p-3 md:p-6 scroll-smooth flex ${filePreviewUrl ? '' : 'justify-center'}`}>
                        {/* Contract Paper Container */}
                        <div className={`w-full relative pb-4 transition-all duration-500 ease-out animate-in slide-in-from-bottom-4 fade-in ${filePreviewUrl ? 'h-full' : 'max-w-[850px]'}`}>
                            {/* Realistic Paper Shadow Effect for HTML Content Only */}
                            {!filePreviewUrl && (
                                <div className="absolute top-4 left-4 w-full h-full bg-slate-900/10 rounded-[2px] blur-md transform translate-y-4"></div>
                            )}
                            {!filePreviewUrl && (
                                <div className="absolute top-0 left-0 w-full h-full bg-white shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] rounded-[1px] -z-10"></div>
                            )}

                            <div className={`${filePreviewUrl ? 'h-full' : 'bg-white ring-1 ring-black/5'} relative z-0 flex flex-col items-center`}>

                                {/* Decorative Head (Subtle) */}
                                {!filePreviewUrl && (
                                    <div className="h-1 bg-gradient-to-r from-orange-500/80 via-orange-400/80 to-orange-500/80 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                )}

                                {/* Content */}
                                <div className={`${filePreviewUrl ? 'p-0 w-full h-full' : 'p-6 md:p-10 flex-1 w-full'}`}>
                                    <style jsx global>{`
                                        .contract-content {
                                            font-family: 'Times New Roman', serif;
                                            font-size: 12pt;
                                            line-height: 1.6;
                                            color: #1a1a1a;
                                            width: 100%;
                                            height: 100%;
                                        }
                                        /* ... styles ... */
                                    `}</style>

                                    <div className="contract-content">
                                        {filePreviewUrl ? (
                                            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center rounded-lg border border-slate-200 border-dashed">
                                                <iframe
                                                    src={filePreviewUrl || ""}
                                                    className="w-full h-full rounded shadow-sm"
                                                    title="Document Preview"
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                dangerouslySetInnerHTML={{ __html: processedContent || "<p class='text-slate-400 italic text-center py-20'>Content generation pending...</p>" }}
                                            />
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* COLLAPSIBLE AI SIDEBAR */}
                    <div className={`
                        border-l border-slate-200 bg-white transition-all duration-300 ease-in-out flex flex-col shrink-0 z-30
                        ${isAiOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}
                    `}>
                        <ContractAssistantSidebar
                            embedded
                            className="h-full"
                            contractId={contractId}
                            content={processedContent}
                            details={details}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
