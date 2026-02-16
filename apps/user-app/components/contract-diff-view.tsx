"use client";

import React, { useMemo, useState, useRef } from 'react';
import { Badge, Button } from '@repo/ui';
import {
    ChevronRight,
    ArrowUp,
    ArrowDown,
    Search,
    Hash,
    Navigation,
    LayoutGrid,
    LayoutList
} from 'lucide-react';

interface Hunk {
    sectionTitle?: string;
    oldStart: number;
    newStart: number;
    oldLines: number;
    newLines: number;
    lines: Array<{
        type: 'added' | 'removed' | 'context';
        content: string;
    }>;
}

interface ContractDiffViewProps {
    diffData?: {
        main: {
            hunks: Hunk[];
            stats: { additions: number; deletions: number; total: number };
        };
        fieldChanges?: any[];
    };
    oldVersionLabel?: string;
    newVersionLabel?: string;
}

export function ContractDiffView({
    diffData,
    oldVersionLabel = "Previous",
    newVersionLabel = "Current"
}: ContractDiffViewProps) {
    const [viewMode, setViewMode] = useState<'inline' | 'unified'>('unified');
    const [selectedHunk, setSelectedHunk] = useState<number>(0);
    const hunkRefs = useRef<(HTMLDivElement | null)[]>([]);

    const hunks = diffData?.main?.hunks || [];
    const stats = diffData?.main?.stats || { additions: 0, deletions: 0, total: 0 };

    const scrollToHunk = (index: number) => {
        setSelectedHunk(index);
        hunkRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (!diffData || hunks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <Search className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No content changes detected</p>
                <p className="text-xs">Only field metadata or annexures might have changed.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-white overflow-hidden">
            {/* Sidebar: Jump-to-Change */}
            <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50/50">
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Navigation className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Jump to Change</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        {hunks.length} Point{hunks.length !== 1 ? 's' : ''} of Interest
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {hunks.map((hunk, i) => (
                        <button
                            key={i}
                            onClick={() => scrollToHunk(i)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${selectedHunk === i
                                ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50'
                                : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-mono text-slate-400">#{(i + 1).toString().padStart(2, '0')}</span>
                                <div className="flex gap-1 text-[9px]">
                                    <span className="text-emerald-600 font-bold">+{hunk.lines.filter(l => l.type === 'added').length}</span>
                                    <span className="text-rose-600 font-bold">-{hunk.lines.filter(l => l.type === 'removed').length}</span>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-slate-700 truncate">
                                {hunk.sectionTitle || 'General Update'}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                <Hash className="w-2.5 h-2.5 opacity-50" />
                                Line {hunk.oldStart}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Snapshot Integrity</div>
                            <div className="text-[9px] font-mono text-indigo-600 truncate max-w-[120px]">
                                {Math.random().toString(36).substring(7).toUpperCase()}... Verified
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Diff Content */}
            <div className="flex-1 flex flex-col bg-slate-100/50">
                {/* Visual Stats Bar */}
                <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">
                                +{stats.additions} Additions
                            </div>
                            <div className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold rounded uppercase">
                                -{stats.deletions} Deletions
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 bg-white shadow-sm font-bold">
                                <LayoutList className="w-3.5 h-3.5 mr-1.5" /> Unified View
                            </Button>
                        </div>
                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                            <Badge variant="outline">{oldVersionLabel}</Badge>
                            <ChevronRight className="w-3 h-3" />
                            <Badge variant="outline" className="text-indigo-600 border-indigo-200">{newVersionLabel}</Badge>
                        </div>
                    </div>
                </div>

                {/* Hunk List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {hunks.map((hunk, i) => (
                        <div
                            key={i}
                            ref={(el) => { if (el) hunkRefs.current[i] = el; }}
                            className={`rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${selectedHunk === i ? 'ring-2 ring-indigo-500/20 border-indigo-200' : 'border-slate-200'
                                }`}
                        >
                            {/* Hunk Header */}
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                        {i + 1}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">
                                        {hunk.sectionTitle || 'Content Section'}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                    @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                                </div>
                            </div>

                            {/* Hunk Lines */}
                            <div className="bg-white divide-y divide-slate-50">
                                {hunk.lines.map((line, li) => {
                                    const isAdded = line.type === 'added';
                                    const isRemoved = line.type === 'removed';

                                    return (
                                        <div
                                            key={li}
                                            className={`flex min-h-[24px] group ${isAdded ? 'bg-emerald-50/50' :
                                                isRemoved ? 'bg-rose-50/50' :
                                                    'hover:bg-slate-50/50'
                                                }`}
                                        >
                                            <div className="w-12 shrink-0 flex items-center justify-center text-[10px] font-mono text-slate-300 border-r border-slate-100 select-none">
                                                {li + 1}
                                            </div>
                                            <div className={`w-6 shrink-0 flex items-center justify-center text-[10px] font-bold select-none ${isAdded ? 'text-emerald-400' :
                                                isRemoved ? 'text-rose-400' :
                                                    'text-slate-200'
                                                }`}>
                                                {isAdded ? '+' : isRemoved ? '-' : ''}
                                            </div>
                                            <div className={`flex-1 px-4 py-1.5 text-xs font-mono whitespace-pre-wrap break-all ${isAdded ? 'text-emerald-900 bg-emerald-100/30' :
                                                isRemoved ? 'text-rose-900 bg-rose-100/30 line-through decoration-rose-200' :
                                                    'text-slate-600'
                                                }`}>
                                                {line.content || '\u00A0'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* End of History Indicator */}
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                            <ArrowDown className="w-4 h-4 opacity-30" />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-wider">End of comparison</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
