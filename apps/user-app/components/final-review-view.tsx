"use client";

import { useState } from "react";
import { Check, Download, ArrowRight, FileCheck, Calendar, User, IndianRupee, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContractAssistantSidebar } from "./contract-assistant-sidebar";

interface FinalReviewViewProps {
    content: string;
    details: any;
    templateName?: string;
    filePreviewUrl?: string | null;
    onSubmit: () => void;
    onBackToEdit?: () => void;
    loading: boolean;
    className?: string;
    isAiOpen?: boolean;
    onToggleAi?: (open: boolean) => void;
    contractId?: string;
}

export function FinalReviewView({
    content,
    details,
    templateName,
    filePreviewUrl,
    onSubmit,
    onBackToEdit,
    loading,
    className = "",
    isAiOpen = false,
    onToggleAi,
    contractId
}: FinalReviewViewProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // A. UPLOAD FLOW: Download original file directly
            if (filePreviewUrl) {
                const a = document.createElement('a');
                a.href = filePreviewUrl;
                // Use title as filename, fallback to 'contract.pdf' (though it might be docx, browser handles blob type usually, but extension helps)
                // Since we don't strictly know extension here without passing it, we can guess or just append .pdf if title lacks it, 
                // but actually for uploads we restricted to PDF/DOC. 
                // Let's use a safe name.
                a.download = `${(details.title || 'contract').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_preview`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return;
            }

            // B. TEMPLATE FLOW: Generate from HTML
            // 1. Prepare Content HTML
            const processedHtml = processVariables(content, details);

            // 2. Wrap in proper HTML structure for the PDF service
            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>${details.title || 'Contract'}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                        @page { margin: 20mm 15mm; size: A4 portrait; }
                        /* Stamp Paper Support (approx 5 inches) */
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

            // 3. Call Serverless PDF Endpoint
            const response = await fetch('/api/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: fullHtml }),
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            // 4. Trigger Download
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
            // Optionally add toast here if context is available, for now console log is sufficient as per original
        } finally {
            setIsDownloading(false);
        }
    };

    // Variable placement logic
    const processVariables = (htmlContent: string, data: any) => {
        if (!htmlContent) return "";

        const replacer = (key: string) => {
            const normalizedKey = key.trim();
            // Map common variances if needed
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

            // Fallback for visual debugging
            return `<span class="bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200 font-mono text-xs">{{${normalizedKey}}}</span>`;
        };

        let processed = htmlContent;

        // 1. Match legacy format: <span data-variable="key">Label</span>
        processed = processed.replace(/<span[^>]*data-variable="([^"]+)"[^>]*>.*?<\/span>/g, (match, key) => {
            const val = replacer(key);
            return val.includes('{{') ? match : val; // Only replace if value found
        });

        // 2. Match TipTap node format: Any span with data-type="variable"
        processed = processed.replace(/<span[^>]*data-type="variable"[^>]*>.*?<\/span>/g, (match, attrs) => {
            // Need to extract ID from the match string more reliably if attributes are mixed
            const idMatch = match.match(/id="([^"]+)"/);
            const key = idMatch ? idMatch[1] : null;
            if (key) {
                const val = replacer(key);
                return val.includes('{{') ? match : val;
            }
            return match;
        });

        // 3. Match Handlebars format: {{variableName}}
        processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            return replacer(key);
        });

        return processed;
    };

    const processedContent = processVariables(content, details);

    return (
        <div className={cn("flex h-full w-full bg-slate-50 relative", className)}>

            {/* LEFT SIDEBAR: Details & Actions */}
            <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 h-full">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 text-orange-600">
                        <FileCheck size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide leading-none">Contract Review</h3>
                        <p className="text-[10px] text-slate-400 mt-1 leading-none">Review details before submission</p>
                    </div>
                </div>

                {/* Details List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-8">
                    {/* Contract Title */}
                    <div className="relative pl-4 border-l-2 border-orange-500">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Contract Title
                        </div>
                        <h3 className="text-lg font-serif font-bold text-slate-900 leading-snug tracking-tight line-clamp-2" title={details.title}>
                            {details.title || "Untitled Contract"}
                        </h3>
                        {templateName && (
                            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 text-[10px] font-bold uppercase tracking-wide border border-orange-100">
                                {templateName}
                            </div>
                        )}
                    </div>

                    {/* Counterparty Card */}
                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 relative group hover:border-slate-200 transition-colors">
                        <div className="absolute top-3 right-3 text-slate-300 group-hover:text-slate-400 transition-colors">
                            <User size={14} />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Business Entity</div>
                                <p className="text-sm font-bold text-slate-900 leading-tight">
                                    {details.counterpartyBusinessName || "N/A"}
                                </p>
                            </div>

                            <div className="pt-3 border-t border-slate-200/50">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Point of Contact</div>
                                <p className="text-sm font-medium text-slate-700 leading-tight">
                                    {details.counterpartyName || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Financials & Term Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                <IndianRupee size={10} /> Total Value
                            </div>
                            <p className="text-2xl font-mono font-bold text-slate-900 tracking-tight">
                                {details.amount ? `₹${Number(details.amount).toLocaleString('en-IN')}` : "-"}
                            </p>
                        </div>

                        <div className="col-span-2 pt-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                <Calendar size={10} /> Contract Term
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                <span>{details.startDate ? new Date(details.startDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: '2-digit' }) : "-"}</span>
                                <ArrowRight size={10} className="text-slate-300" />
                                <span>{details.endDate ? new Date(details.endDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: '2-digit' }) : "-"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100/50 flex items-start gap-3">
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Check size={10} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-800">Draft Completed</p>
                            <p className="text-[10px] text-emerald-600/80 leading-relaxed mt-0.5">
                                All required fields are populated. Ready for final review and approval.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                {/* Actions Footer - Premium "Designer Approved" Styles */}
                <div className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm space-y-3 z-10">
                    <button
                        onClick={onSubmit}
                        disabled={loading}
                        className="w-full group relative overflow-hidden py-3 bg-slate-900 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.23)] hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-xs uppercase tracking-widest flex items-center justify-center"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2 relative z-10"><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</span>
                        ) : (
                            <span className="flex items-center gap-2 relative z-10">
                                Finalise Draft
                                <ArrowRight size={14} className="opacity-70 group-hover:translate-x-1 transition-transform duration-300" />
                            </span>
                        )}
                        {/* Subtle shine effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="w-full group py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl transition-all duration-300 hover:border-orange-200 hover:bg-orange-50/30 hover:text-orange-700 hover:shadow-md active:bg-orange-50 text-[10px] uppercase tracking-wide flex items-center justify-center disabled:opacity-50"
                    >
                        {isDownloading ? (
                            <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> Saving...</span>
                        ) : (
                            <>
                                <Download size={14} className="mr-2 text-slate-400 group-hover:text-orange-500 transition-colors" />
                                Download Draft
                            </>
                        )}
                    </button>

                    {onBackToEdit && (
                        <button
                            onClick={onBackToEdit}
                            className="w-full py-2 text-slate-400 font-bold rounded-lg transition-colors hover:text-slate-800 hover:bg-slate-50 text-[10px] uppercase tracking-widest"
                        >
                            Back to Edit
                        </button>
                    )}
                </div>
            </div>

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
                    <div className={`flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth flex ${filePreviewUrl ? '' : 'justify-center'}`}>
                        {/* Contract Paper Container */}
                        <div className={`w-full relative pb-12 transition-all duration-500 ease-out animate-in slide-in-from-bottom-4 fade-in ${filePreviewUrl ? 'h-full' : 'max-w-[850px]'}`}>
                            {/* Realistic Paper Shadow Effect for HTML Content Only */}
                            {!filePreviewUrl && (
                                <div className="absolute top-4 left-4 w-full h-full bg-slate-900/10 rounded-[2px] blur-md transform translate-y-4"></div>
                            )}
                            {!filePreviewUrl && (
                                <div className="absolute top-0 left-0 w-full h-full bg-white shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] rounded-[1px] -z-10"></div>
                            )}

                            <div className={`${filePreviewUrl ? 'h-full' : 'bg-white min-h-[1100px] ring-1 ring-black/5'} relative z-0 flex flex-col items-center`}>

                                {/* Decorative Head (Subtle) */}
                                {!filePreviewUrl && (
                                    <div className="h-1 bg-gradient-to-r from-orange-500/80 via-orange-400/80 to-orange-500/80 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                )}

                                {/* Content */}
                                <div className={`${filePreviewUrl ? 'p-0 w-full h-full' : 'p-8 md:p-12 flex-1 w-full'}`}>
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

                                {/* Footer: Page Number Simulation */}
                                <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none">
                                    <span className="text-[10px] text-slate-300 font-serif">Page 1</span>
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
                            content={content}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
