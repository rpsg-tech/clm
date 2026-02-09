'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useContract } from '@/lib/hooks/use-contract';
import { MaterialIcon } from '@/components/ui/material-icon';
import { OracleRiskPanel } from '@/components/contracts/oracle-risk-panel';
import { Skeleton } from '@repo/ui';

interface PageProps {
    params: Promise<{ id: string }>;
}

interface ContractData {
    id: string;
    title?: string;
    reference?: string;
    content?: string;
    annexureData?: string;
    createdAt: string;
}

export default function ContractPreviewPage({ params }: PageProps) {
    const { id } = use(params);
    const { data: contract, isLoading } = useContract(id);
    const [zoom, setZoom] = useState(100);

    const c = contract as ContractData | undefined;

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] -m-8">
                <div className="flex-1 p-8">
                    <Skeleton className="h-full w-full max-w-[850px] mx-auto rounded-sm" />
                </div>
                <div className="w-[380px] border-l border-neutral-200 p-4">
                    <Skeleton className="h-48 rounded-xl mb-4" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!c) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-neutral-500">Contract not found</p>
            </div>
        );
    }

    // Combine Part A and Part B content
    const partAContent = c.content || '';
    const partBContent = c.annexureData || '';

    return (
        <div className="-m-8 flex flex-col h-[calc(100vh-4rem)]">
            {/* Stepper Bar */}
            <div className="h-16 bg-white border-b border-neutral-200 flex items-center justify-center flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-30">
                <div className="flex items-center gap-6">
                    {/* Step 1: Details (completed) */}
                    <div className="flex items-center gap-2.5 opacity-60">
                        <div className="size-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center ring-1 ring-green-200">
                            <MaterialIcon name="check" size={14} />
                        </div>
                        <span className="text-sm font-medium text-neutral-600">Details</span>
                    </div>
                    <div className="w-12 h-px bg-neutral-200" />
                    {/* Step 2: Editor (completed) */}
                    <div className="flex items-center gap-2.5 opacity-60">
                        <div className="size-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center ring-1 ring-green-200">
                            <MaterialIcon name="check" size={14} />
                        </div>
                        <span className="text-sm font-medium text-neutral-600">Editor</span>
                    </div>
                    <div className="w-12 h-px bg-neutral-200" />
                    {/* Step 3: Preview (current) */}
                    <div className="flex items-center gap-2.5">
                        <div className="size-6 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-indigo-700/30 ring-2 ring-indigo-700/20 ring-offset-2">
                            3
                        </div>
                        <span className="text-sm font-bold text-neutral-900">Preview</span>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Document preview area */}
                <main className="flex-1 overflow-y-auto p-8 flex justify-center bg-neutral-100/50 relative">
                    {/* Read-only badge */}
                    <div className="fixed top-28 left-[calc(50%-190px)] z-30 bg-neutral-800/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg border border-white/10">
                        <MaterialIcon name="lock" size={12} />
                        Read-only Preview
                    </div>

                    {/* Zoom controls */}
                    <div className="fixed bottom-28 left-[calc(50%-190px)] z-30 bg-white border border-neutral-200 p-1 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex gap-0.5">
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

                    {/* The document "paper" */}
                    <div
                        className="bg-white w-full max-w-[850px] min-h-[1100px] shadow-2xl shadow-neutral-200/50 border border-neutral-200/60 mb-16 px-20 py-24 text-neutral-800 transition-transform duration-300"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        {/* Document Header */}
                        <div className="border-b-2 border-neutral-900 pb-8 mb-12 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold leading-tight mb-3 font-serif">{c.title || 'Untitled Agreement'}</h1>
                                <p className="text-base italic opacity-70 font-serif text-neutral-600">Combined View: Part A &amp; Part B</p>
                            </div>
                            <div className="text-right text-xs opacity-60 space-y-1">
                                {c.reference && <p>Ref: {c.reference}</p>}
                                <p>Date: {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>

                        {/* Part A */}
                        {partAContent && (
                            <section className="mb-14">
                                <div className="flex items-center gap-4 mb-8">
                                    <h2 className="text-lg font-bold uppercase tracking-widest text-indigo-700 border-b-2 border-indigo-700/20 pb-1">
                                        Part A: General Terms
                                    </h2>
                                </div>
                                <div
                                    className="space-y-6 text-[17px] leading-relaxed text-justify font-serif"
                                    dangerouslySetInnerHTML={{ __html: partAContent }}
                                />
                            </section>
                        )}

                        {/* Divider between Part A and Part B */}
                        {partAContent && partBContent && (
                            <div className="flex items-center gap-6 my-14 opacity-20">
                                <div className="h-px bg-neutral-900 flex-1" />
                                <MaterialIcon name="link" size={16} />
                                <div className="h-px bg-neutral-900 flex-1" />
                            </div>
                        )}

                        {/* Part B */}
                        {partBContent && (
                            <section className="mb-14">
                                <div className="flex items-center gap-4 mb-8">
                                    <h2 className="text-lg font-bold uppercase tracking-widest text-indigo-700 border-b-2 border-indigo-700/20 pb-1">
                                        Part B: Specific Provisions
                                    </h2>
                                </div>
                                <div
                                    className="space-y-6 text-[17px] leading-relaxed text-justify font-serif"
                                    dangerouslySetInnerHTML={{ __html: partBContent }}
                                />
                            </section>
                        )}

                        {/* Empty state */}
                        {!partAContent && !partBContent && (
                            <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
                                <MaterialIcon name="description" size={48} className="mb-4" />
                                <p className="text-lg font-medium">No document content available</p>
                                <p className="text-sm mt-1">Go back to the editor to add content.</p>
                            </div>
                        )}

                        {/* Signature blocks */}
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
                </main>

                {/* Oracle AI sidebar */}
                <aside className="w-[380px] bg-violet-50 border-l border-violet-100 flex flex-col flex-shrink-0 z-20 shadow-xl">
                    <OracleRiskPanel contractId={id} />
                </aside>
            </div>

            {/* Footer */}
            <footer className="h-20 bg-white border-t border-neutral-200 px-8 flex items-center justify-between flex-shrink-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                <Link
                    href={`/dashboard/contracts/${id}/edit`}
                    className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-neutral-100"
                >
                    <MaterialIcon name="arrow_back" size={20} />
                    Back to Editor
                </Link>
                <div className="flex items-center gap-6">
                    <span className="text-xs text-neutral-500 flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                        <MaterialIcon name="cloud_done" size={14} className="text-green-600" />
                        Auto-saved
                    </span>
                    <button className="bg-indigo-700 hover:bg-indigo-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg shadow-indigo-700/20 transition-all flex items-center gap-2 active:scale-95">
                        Save as Draft
                        <MaterialIcon name="save" size={16} />
                    </button>
                </div>
            </footer>
        </div>
    );
}
