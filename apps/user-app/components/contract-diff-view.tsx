"use client";

import React, { useMemo } from 'react';
import { diffWords } from 'diff';
import { Badge } from '@repo/ui';

interface ContractDiffViewProps {
    oldContent: string;
    newContent: string;
    oldVersionLabel?: string;
    newVersionLabel?: string;
}

export function ContractDiffView({
    oldContent,
    newContent,
    oldVersionLabel = "Previous Version",
    newVersionLabel = "Current Version"
}: ContractDiffViewProps) {

    const [viewMode, setViewMode] = React.useState<'inline' | 'split'>('inline');

    // Compute diffs
    const diffs = useMemo(() => {
        if (!oldContent && !newContent) return [];
        return diffWords(oldContent || '', newContent || '');
    }, [oldContent, newContent]);

    // Calculate stats
    const stats = useMemo(() => {
        let additions = 0;
        let deletions = 0;
        diffs.forEach(part => {
            if (part.added) additions++;
            if (part.removed) deletions++;
        });
        return { additions, deletions };
    }, [diffs]);

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header / Legend */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <span className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-sm"></span>
                        <span className="text-emerald-700">Added ({stats.additions})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <span className="w-3 h-3 bg-rose-100 border border-rose-300 rounded-sm line-through decoration-rose-500"></span>
                        <span className="text-rose-700">Removed ({stats.deletions})</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-200 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setViewMode('inline')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'inline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Inline
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Side-by-Side
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-4">
                        <Badge variant="outline" className="font-mono">{oldVersionLabel}</Badge>
                        <span>→</span>
                        <Badge variant="outline" className="font-mono">{newVersionLabel}</Badge>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'inline' ? (
                    <div className="absolute inset-0 overflow-auto p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap bg-white">
                        {diffs.map((part, index) => {
                            if (part.added) {
                                return (
                                    <span
                                        key={index}
                                        className="bg-emerald-100 text-emerald-900 border-b-2 border-emerald-300 px-0.5 mx-0.5 rounded-t-sm"
                                        title="Added"
                                    >
                                        {part.value}
                                    </span>
                                );
                            }
                            if (part.removed) {
                                return (
                                    <span
                                        key={index}
                                        className="bg-rose-100 text-rose-900 border-b-2 border-rose-300 px-0.5 mx-0.5 rounded-t-sm line-through decoration-rose-500/50 decoration-2"
                                        title="Removed"
                                    >
                                        {part.value}
                                    </span>
                                );
                            }
                            return <span key={index} className="text-slate-600">{part.value}</span>;
                        })}
                    </div>
                ) : (
                    <div className="flex h-full divide-x divide-slate-200">
                        {/* Left: Original (Redline) */}
                        <div className="flex-1 overflow-auto p-8 bg-slate-50/30">
                            <div className="mb-4 pb-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-slate-50/30 backdrop-blur-sm">
                                Original
                            </div>
                            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                {diffs.map((part, index) => {
                                    if (part.removed) {
                                        return (
                                            <span
                                                key={index}
                                                className="bg-rose-100 text-rose-900 border-b-2 border-rose-300 px-0.5 mx-0.5 rounded-t-sm line-through decoration-rose-500/50 decoration-2"
                                            >
                                                {part.value}
                                            </span>
                                        );
                                    }
                                    if (!part.added) {
                                        return <span key={index} className="text-slate-500">{part.value}</span>;
                                    }
                                    return null;
                                })}
                            </div>
                        </div>

                        {/* Right: New (Greenline) */}
                        <div className="flex-1 overflow-auto p-8 bg-white">
                            <div className="mb-4 pb-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white backdrop-blur-sm">
                                Modified
                            </div>
                            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                {diffs.map((part, index) => {
                                    if (part.added) {
                                        return (
                                            <span
                                                key={index}
                                                className="bg-emerald-100 text-emerald-900 border-b-2 border-emerald-300 px-0.5 mx-0.5 rounded-t-sm"
                                            >
                                                {part.value}
                                            </span>
                                        );
                                    }
                                    if (!part.removed) {
                                        return <span key={index} className="text-slate-900">{part.value}</span>;
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
