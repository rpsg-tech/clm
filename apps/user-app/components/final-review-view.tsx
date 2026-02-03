"use client";

import { useState } from "react";
import { Check, Download, ArrowRight, FileCheck } from "lucide-react";

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
        processed = processed.replace(/<span([^>]*data-type="variable"[^>]*)>.*?<\/span>/g, (match, attrs) => {
            const idMatch = attrs.match(/id="([^"]+)"/);
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
    // Continuous View: Pages are not split visually in the web view.


    return (
        <div className={`flex flex-col h-full bg-slate-100/50 border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300 ${className}`}>
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-200/60 flex items-center justify-between bg-white/95 backdrop-blur-xl z-10 sticky top-0 shadow-sm supports-[backdrop-filter]:bg-white/60">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 ring-1 ring-orange-100">
                        <FileCheck size={24} className="drop-shadow-sm" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Final Document Preview</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 uppercase tracking-wide border border-green-100/50">
                                Ready for Submission
                            </span>
                            <span className="text-slate-300">•</span>
                            <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] capitalize" title={templateName}>
                                {templateName || "Custom Contract"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Current Status</p>
                        <p className="text-xs font-semibold text-slate-900">Drafting Complete</p>
                    </div>
                </div>
            </div>

            {/* Document Workspace */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 flex justify-center p-6 lg:p-10 relative scroll-smooth">
                {/* Contract Paper Container */}
                {/* Contract Paper Container */}
                <div className="w-full max-w-[800px] flex flex-col gap-8 pb-20">

                    {/* Metadata Banner */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Contract Title</p>
                            <p className="text-sm font-bold text-slate-900 truncate leading-snug" title={details.title}>{details.title || "Untitled Contract"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Counterparty</p>
                            <p className="text-sm font-bold text-slate-900 truncate leading-snug">{details.counterpartyName || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Value</p>
                            <p className="text-sm font-bold text-slate-900 font-mono tracking-tight">{details.amount ? `₹${Number(details.amount).toLocaleString('en-IN')}` : "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Term</p>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                <span>{details.startDate ? new Date(details.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : "-"}</span>
                                <span className="text-slate-300">→</span>
                                <span>{details.endDate ? new Date(details.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : "-"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Single Continuous Page View */}
                    <div className="bg-white shadow-xl border border-slate-200 min-h-[1000px] h-fit relative flow-root">
                        {/* Header Effect */}
                        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 opacity-90" />

                        <div className="p-12 md:p-20">
                            <style jsx global>{`
                                .contract-content {
                                    font-family: 'Times New Roman', serif;
                                    font-size: 12pt;
                                    line-height: 1.6;
                                    color: #000;
                                    width: 100%;
                                }
                                /* Reset for safety */
                                .contract-content * {
                                    max-width: 100%;
                                    box-sizing: border-box;
                                }
                                .contract-content h1, 
                                .contract-content h2, 
                                .contract-content h3, 
                                .contract-content h4 {
                                    font-weight: bold;
                                    margin-top: 1.5em;
                                    margin-bottom: 0.8em;
                                    line-height: 1.3;
                                    page-break-after: avoid;
                                }
                                .contract-content p {
                                    margin-bottom: 1em;
                                    orphans: 3;
                                    widows: 3;
                                }
                                .contract-content table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin: 1.5em 0;
                                    table-layout: fixed; /* Ensures table stays within bounds */
                                    background-color: white; 
                                }
                                .contract-content td, 
                                .contract-content th {
                                    border: 1px solid #000;
                                    padding: 8px 12px;
                                    vertical-align: top;
                                    background-color: white; 
                                    word-wrap: break-word; /* Prevents long words breaking layout */
                                }
                                .contract-content th {
                                    background-color: #f3f3f3;
                                    font-weight: bold;
                                    text-align: left;
                                }
                                .contract-content ul, 
                                .contract-content ol {
                                    margin-left: 1.5em;
                                    margin-bottom: 1em;
                                    padding-left: 1.5em;
                                }
                                .contract-content li {
                                    margin-bottom: 0.5em;
                                }
                                /* Visual separator for page breaks in web view */
                                .page-break { 
                                    border-bottom: 2px dashed #eee;
                                    margin: 2rem 0;
                                    position: relative;
                                    display: block; /* Ensure it takes space */
                                    width: 100%;
                                }
                                .page-break::after {
                                    content: 'PAGE BREAK';
                                    position: absolute;
                                    right: 0;
                                    top: -10px;
                                    font-size: 8px;
                                    color: #cbd5e1;
                                    background: white;
                                    padding-left: 8px;
                                }
                            `}</style>
                            <div className="contract-content max-w-none text-slate-800">
                                {filePreviewUrl ? (
                                    <div className="w-full h-[800px] bg-slate-100 flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200">
                                        <iframe
                                            src={filePreviewUrl}
                                            className="w-full h-full"
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

            {/* Footer Action Bar */}
            <div className="p-4 border-t border-slate-200 bg-white z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between gap-4">
                    <div className="hidden md:flex flex-col">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Ready for Review</span>
                        <span className="text-[10px] text-slate-500 font-medium">This will submit the contract for internal approval.</span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex-1 md:flex-none px-6 py-2.5 bg-white border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all shadow-sm text-xs uppercase tracking-wide inline-flex items-center justify-center disabled:opacity-50"
                        >
                            {isDownloading ? (
                                <span className="animate-pulse">Saving...</span>
                            ) : (
                                <>
                                    <Download size={14} className="mr-2 text-slate-400" />
                                    Download PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={loading}
                            className="flex-[2] md:flex-none px-8 py-2.5 bg-slate-900 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed text-xs uppercase tracking-wide inline-flex items-center justify-center min-w-[160px]"
                        >
                            {loading ? (
                                <span className="inline-flex items-center animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    Submit Contract
                                    <ArrowRight size={14} className="ml-2 opacity-90" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
