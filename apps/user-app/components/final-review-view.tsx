"use client";

import { useState } from "react";
import { Check, Download, ArrowRight, FileCheck, Calendar, User, IndianRupee, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinalReviewViewProps {
    content: string;
    details: any;
    templateName?: string;
    filePreviewUrl?: string | null;
    onSubmit: () => void;
    loading: boolean;
    className?: string; // Allow custom styling override
}

export function FinalReviewView({ content, details, templateName, filePreviewUrl, onSubmit, loading, className = "" }: FinalReviewViewProps) {
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
        <div className={cn("flex h-full bg-slate-50 relative", className)}>

            {/* LEFT SIDEBAR: Details & Actions */}
            <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 h-full">
                {/* Header */}
                <div className="p-5 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Contract Review</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Review details before submission</p>
                </div>

                {/* Details List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <FileText size={12} />
                            <span>Contract Title</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight" title={details.title}>
                            {details.title || "Untitled Contract"}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            {templateName || "Custom Template"}
                        </p>
                    </div>

                    <div className="h-px bg-slate-100 w-full" />

                    {/* Counterparty */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <User size={12} />
                            <span>Counterparty</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                            {details.counterpartyName || "-"}
                        </p>
                    </div>

                    {/* Value */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <IndianRupee size={12} />
                            <span>Total Value</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-slate-900">
                            {details.amount ? `₹${Number(details.amount).toLocaleString('en-IN')}` : "-"}
                        </p>
                    </div>

                    {/* Term */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Calendar size={12} />
                            <span>Term</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <span>{details.startDate ? new Date(details.startDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: '2-digit' }) : "-"}</span>
                            <ArrowRight size={10} className="text-slate-300" />
                            <span>{details.endDate ? new Date(details.endDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: '2-digit' }) : "-"}</span>
                        </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-start gap-3">
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Check size={10} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-800">Ready for Review</p>
                            <p className="text-[10px] text-emerald-600 leading-relaxed mt-0.5">
                                Document analysis complete. Ready to initiate approval workflow.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
                    <button
                        onClick={onSubmit}
                        disabled={loading}
                        className="w-full group py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-xs uppercase tracking-wide flex items-center justify-center"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</span>
                        ) : (
                            <>
                                Submit for Approval
                                <ArrowRight size={14} className="ml-2 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="w-full group py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl transition-all text-[10px] uppercase tracking-wide flex items-center justify-center disabled:opacity-50"
                    >
                        {isDownloading ? (
                            <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> Saving...</span>
                        ) : (
                            <>
                                <Download size={14} className="mr-2 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                Download Draft
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT: Document Workspace */}
            <div className="flex-1 h-full overflow-y-auto bg-slate-100/50 relative flex justify-center p-4 md:p-8 scroll-smooth">
                {/* Contract Paper Container */}
                <div className="w-full max-w-[800px] relative pb-20">
                    {/* Realistic Paper Shadow Effect */}
                    <div className="relative group">
                        {/* Layered shadows for depth */}
                        <div className="absolute top-2 left-2 w-full h-full bg-slate-900/5 rounded-[2px] blur-sm transform translate-y-2"></div>

                        <div className="bg-white min-h-[1000px] relative z-0 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">

                            {/* Decorative Head (Subtle) */}
                            <div className="h-1 bg-gradient-to-r from-orange-500/80 via-orange-400/80 to-orange-500/80 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            {/* Content */}
                            <div className="p-8 md:p-12 flex-1">
                                <style jsx global>{`
                                    .contract-content {
                                        font-family: 'Times New Roman', serif;
                                        font-size: 12pt;
                                        line-height: 1.6;
                                        color: #1a1a1a;
                                        width: 100%;
                                    }
                                    .contract-content h1, 
                                    .contract-content h2, 
                                    .contract-content h3 {
                                        font-weight: 700;
                                        color: #000;
                                        line-height: 1.3;
                                    }
                                    .contract-content p {
                                        margin-bottom: 1.2em;
                                        text-align: justify;
    
                                    }
                                    /* Web View Page Break Indicator */
                                    .page-break { 
                                        border-bottom: 1px dashed #e2e8f0;
                                        margin: 3rem 0;
                                        position: relative;
                                        display: block;
                                        width: 100%;
                                    }
                                    .page-break::after {
                                        content: 'PAGE BREAK';
                                        position: absolute;
                                        right: 0;
                                        top: -9px;
                                        font-size: 9px;
                                        color: #94a3b8;
                                        background: white;
                                        padding-left: 8px;
                                        font-family: sans-serif;
                                        font-weight: 600;
                                        letter-spacing: 0.05em;
                                    }
                                `}</style>

                                <div className="contract-content">
                                    {filePreviewUrl ? (
                                        <div className="w-full h-[800px] bg-slate-50 flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 border-dashed">
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
            </div>
        </div>
    );
}
