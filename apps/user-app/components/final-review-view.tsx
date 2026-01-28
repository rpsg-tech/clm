"use client";

import { useState } from "react";
import { Check, Download, ArrowRight, FileCheck } from "lucide-react";

interface FinalReviewViewProps {
    content: string;
    details: any;
    templateName?: string;
    onSubmit: () => void;
    loading: boolean;
    className?: string; // Allow custom styling override
}

export function FinalReviewView({ content, details, templateName, onSubmit, loading, className = "" }: FinalReviewViewProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
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
        console.log("Processing Variables. Data:", data);

        const replacer = (key: string) => {
            console.log("Replacing Key:", key, "Value:", data[key]);
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
            if (key) {
                console.log("Found TipTap Variable:", key);
                return replacer(key) || match;
            }
            return match;
        });

        return processed;
    };

    const processedContent = processVariables(content, details);

    return (
        <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300 ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-600 shadow-sm border border-primary-200/50">
                        <FileCheck size={20} className="drop-shadow-sm" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Final Document Preview</h2>
                        <p className="text-xs text-neutral-500 font-medium">Ready for submission • {templateName || "Custom Contract"}</p>
                    </div>
                </div>

                <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded-lg font-medium">Read Mode</span>
                </div>
            </div>

            {/* Document Workspace */}
            <div className="flex-1 overflow-y-auto bg-neutral-50 flex justify-center p-6 lg:p-10 relative">
                {/* Contract Paper Container */}
                <div className="w-full max-w-[800px] flex flex-col gap-8 pb-20">

                    {/* Metadata Banner */}
                    <div className="bg-white rounded-xl border border-neutral-200/60 p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-1">Contract Title</p>
                            <p className="text-sm font-semibold text-neutral-900 truncate" title={details.title}>{details.title || "Untitled"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-1">Counterparty</p>
                            <p className="text-sm font-semibold text-neutral-900 truncate">{details.counterpartyName || "-"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-1">Total Value</p>
                            <p className="text-sm font-semibold text-neutral-900">{details.amount ? `₹${details.amount}` : "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-1">Duration</p>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-neutral-900">{details.startDate || "-"}</span>
                                <span className="text-[10px] text-neutral-400">to</span>
                                <span className="text-xs font-semibold text-neutral-900">{details.endDate || "-"}</span>
                            </div>
                        </div>
                    </div>

                    {processedContent.split(/<div\s+style="[^"]*page-break-before:\s*always[^"]*"[^>]*>[\s\S]*?<\/div>/gi)
                        .filter(content => {
                            if (!content) return false;
                            const textOnly = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                            const hasStructure = /<(img|table|hr|iframe|video)/i.test(content);
                            return textOnly.length > 0 || hasStructure;
                        })
                        .map((pageContent, index) => (
                            <div
                                key={index}
                                className={`bg-white shadow-sm md:shadow-xl border border-neutral-200/50 print:border-none print:shadow-none mb-8 last:mb-0 relative group min-h-[1000px] ${index > 0 ? 'page-break-before-always' : ''}`}
                                style={index > 0 ? { pageBreakBefore: 'always' } : {}}
                            >
                                {/* Paper Texture/Header Effect - Only on first page */}
                                {index === 0 && (
                                    <div className="h-2 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 opacity-90" />
                                )}

                                <div className="p-12 md:p-16">
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
                                    <div
                                        className="prose prose-sm md:prose-base max-w-none text-neutral-800 font-serif leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: pageContent || "<p class='text-neutral-400 italic text-center py-20'>Content generation pending...</p>" }}
                                    />
                                </div>

                                {/* Pagination/Footer hint */}
                                <div className="absolute bottom-4 right-8 text-[10px] text-neutral-300 font-mono select-none">
                                    PAGE {index + 1}
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Footer Action Bar */}
            <div className="p-4 border-t border-neutral-200 bg-white z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between gap-4">
                    <div className="hidden md:flex flex-col">
                        <span className="text-xs font-bold text-neutral-900 uppercase">Ready for Review</span>
                        <span className="text-[10px] text-neutral-500">This will submit the contract for internal approval.</span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex-1 md:flex-none px-6 py-3 bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-semibold rounded-xl transition-all shadow-sm text-sm inline-flex items-center justify-center disabled:opacity-50"
                        >
                            {isDownloading ? (
                                <span className="animate-pulse">Saving...</span>
                            ) : (
                                <>
                                    <Download size={16} className="mr-2 text-neutral-500" />
                                    Download PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={loading}
                            className="flex-[2] md:flex-none px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 disabled:opacity-70 disabled:cursor-not-allowed text-sm inline-flex items-center justify-center min-w-[180px]"
                        >
                            {loading ? (
                                <span className="inline-flex items-center animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    Submit Contract
                                    <ArrowRight size={16} className="ml-2 opacity-90" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
