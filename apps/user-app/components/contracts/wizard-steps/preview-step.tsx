'use client';

import { useState } from 'react';

import { MaterialIcon } from '@/components/ui/material-icon';
import { AiChatWidget } from '@/components/contracts/ai-chat-widget';

interface PreviewStepProps {
    templateContent: string;
    annexureContent: string;
    contractTitle: string;
    contractReference?: string;
}

export function PreviewStep({
    templateContent,
    annexureContent,
    contractTitle,
    contractReference,
}: PreviewStepProps) {
    const [zoom, setZoom] = useState(100);

    const today = new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });

    const hasPartA = Boolean(templateContent);
    const hasPartB = Boolean(annexureContent);

    return (
        <div className="-mx-[calc(50vw-50%)] px-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-sm font-semibold text-neutral-900">Full Document Preview</p>
                    <p className="text-xs text-neutral-500">Combined view of Part A and Part B</p>
                </div>

            </div>

            <div className="flex gap-6">
                <main className="flex-1 min-w-0">
                    <div className="relative overflow-y-auto p-8 flex justify-center bg-neutral-100/50 rounded-xl border border-neutral-200">
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-neutral-800/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg border border-white/10">
                            <MaterialIcon name="lock" size={12} />
                            Read-only Preview
                        </div>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white border border-neutral-200 p-1 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex gap-0.5">
                            <button
                                onClick={() => setZoom(Math.max(50, zoom - 10))}
                                disabled={zoom <= 50}
                                className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <MaterialIcon name="remove" size={20} />
                            </button>
                            <span className="px-2 py-2 text-sm font-medium text-neutral-600 w-14 text-center tabular-nums">
                                {zoom}%
                            </span>
                            <button
                                onClick={() => setZoom(Math.min(200, zoom + 10))}
                                disabled={zoom >= 200}
                                className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <MaterialIcon name="add" size={20} />
                            </button>
                            <div className="w-px h-6 bg-neutral-200 my-auto mx-1.5" />
                            <button className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors" title="Print">
                                <MaterialIcon name="print" size={20} />
                            </button>
                            <button className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors" title="Download PDF">
                                <MaterialIcon name="download" size={20} />
                            </button>
                        </div>

                        <div
                            className="bg-white w-full max-w-[850px] min-h-[1100px] shadow-2xl shadow-neutral-200/50 border border-neutral-200/60 mb-16 px-20 py-24 text-neutral-800 transition-transform duration-300"
                            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                        >
                            <div className="border-b-2 border-neutral-900 pb-8 mb-12 flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-bold leading-tight mb-3 font-serif">
                                        {contractTitle || 'Untitled Agreement'}
                                    </h1>
                                    <p className="text-base italic opacity-70 font-serif text-neutral-600">
                                        Combined View: Part A &amp; Part B
                                    </p>
                                </div>
                                <div className="text-right text-xs opacity-60 space-y-1">
                                    {contractReference && <p>Ref: {contractReference}</p>}
                                    <p>Date: {today}</p>
                                </div>
                            </div>

                            {hasPartA && (
                                <section className="mb-14">
                                    <div className="flex items-center gap-4 mb-8">
                                        <h2 className="text-lg font-bold uppercase tracking-widest text-primary-700 border-b-2 border-primary-700/20 pb-1">
                                            Part A: General Terms
                                        </h2>
                                    </div>
                                    <div
                                        className="space-y-6 text-[17px] leading-relaxed text-justify font-serif"
                                        dangerouslySetInnerHTML={{ __html: templateContent }}
                                    />
                                </section>
                            )}

                            {hasPartA && hasPartB && (
                                <div className="flex items-center gap-6 my-14 opacity-20">
                                    <div className="h-px bg-neutral-900 flex-1" />
                                    <MaterialIcon name="link" size={16} />
                                    <div className="h-px bg-neutral-900 flex-1" />
                                </div>
                            )}

                            {hasPartB && (
                                <section className="mb-14">
                                    <div className="flex items-center gap-4 mb-8">
                                        <h2 className="text-lg font-bold uppercase tracking-widest text-primary-700 border-b-2 border-primary-700/20 pb-1">
                                            Part B: Specific Provisions
                                        </h2>
                                    </div>
                                    <div
                                        className="space-y-6 text-[17px] leading-relaxed text-justify font-serif"
                                        dangerouslySetInnerHTML={{ __html: annexureContent }}
                                    />
                                </section>
                            )}

                            {!hasPartA && !hasPartB && (
                                <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
                                    <MaterialIcon name="description" size={48} className="mb-4" />
                                    <p className="text-lg font-medium">No document content available</p>
                                    <p className="text-sm mt-1">Go back to the editor to add content.</p>
                                </div>
                            )}

                            <div className="mt-24 pt-12 border-t border-neutral-300">
                                <div className="grid grid-cols-2 gap-24">
                                    <div>
                                        <div className="h-14 border-b-2 border-neutral-900 mb-4" />
                                        <p className="font-bold text-lg font-serif">Client Representative</p>
                                        <p className="text-sm opacity-60 mt-1">Date: _______________</p>
                                    </div>
                                    <div>
                                        <div className="h-14 border-b-2 border-neutral-900 mb-4" />
                                        <p className="font-bold text-lg font-serif">Provider Representative</p>
                                        <p className="text-sm opacity-60 mt-1">Date: _______________</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>


            </div>

            <AiChatWidget />
        </div>
    );
}
