'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api-client';
import { Button, Badge } from '@repo/ui';
import {
    ArrowLeft,
    ArrowRight,
    Minus,
    Plus,
    FileText,
    Columns,
    BookOpen,
    Eraser,
    Hash,
    CheckCircle2
} from 'lucide-react';
import { diffLines, diffWords, Change } from 'diff';

interface VersionDiffViewerProps {
    contractId: string;
    fromVersionId: string;
    toVersionId: string;
    onBack: () => void;
}

/**
 * Utility to strip HTML for text-based diffing
 */
function stripHtml(html: string): string {
    if (!html) return '';
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    return text.trim();
}

/**
 * Interface for a diff hunk with context
 */
interface Hunk {
    changes: Change[];
    fromStartLine: number;
    toStartLine: number;
}

/**
 * Sub-component to render an individual hunk to avoid Rules of Hooks violations
 */
function DiffHunk({ hunk, viewMode, fromVersion, toVersion }: {
    hunk: Hunk;
    viewMode: 'unified' | 'split';
    fromVersion: string;
    toVersion: string;
}) {
    const fromText = useMemo(() => hunk.changes.filter(c => !c.added).map(c => c.value).join(''), [hunk.changes]);
    const toText = useMemo(() => hunk.changes.filter(c => !c.removed).map(c => c.value).join(''), [hunk.changes]);
    const wordDiff = useMemo(() => diffWords(fromText, toText), [fromText, toText]);

    if (viewMode === 'unified') {
        return (
            <div className="text-[16px] leading-[1.8] text-slate-700 space-y-4 font-serif">
                {wordDiff.map((part, i) => (
                    <span key={i} className={`
                        ${part.added ? 'bg-emerald-100 text-emerald-900 underline decoration-emerald-400/50 decoration-2 underline-offset-4 px-0.5 mx-0.5 rounded-sm' : ''}
                        ${part.removed ? 'bg-rose-50 text-rose-900/30 line-through decoration-rose-300 decoration-1 px-0.5 mx-0.5 rounded-sm' : 'whitespace-pre-wrap'}
                    `}>
                        {part.value}
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-12 text-[15px] leading-relaxed italic font-serif">
            <div className="space-y-4 pr-6 border-r border-slate-100">
                <div className="text-[10px] font-bold text-slate-300 mb-2 tracking-widest uppercase">Version {fromVersion}</div>
                <div className="text-slate-500 opacity-60">
                    {wordDiff.map((part, i) => (
                        <span key={i} className={part.removed ? 'bg-rose-50 text-rose-800 line-through' : ''}>
                            {part.added ? '' : part.value}
                        </span>
                    ))}
                </div>
            </div>
            <div className="space-y-4 pl-6">
                <div className="text-[10px] font-bold text-indigo-400 mb-2 tracking-widest uppercase">Version {toVersion}</div>
                <div className="text-slate-800 font-medium">
                    {wordDiff.map((part, i) => (
                        <span key={i} className={part.added ? 'bg-emerald-50 text-emerald-800 p-0.5 rounded outline outline-1 outline-emerald-100' : ''}>
                            {part.removed ? '' : part.value}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function VersionDiffViewer({ contractId, fromVersionId, toVersionId, onBack }: VersionDiffViewerProps) {
    const [mainDiff, setMainDiff] = useState<Change[]>([]);
    const [annexureDiff, setAnnexureDiff] = useState<Change[]>([]);
    const [loading, setLoading] = useState(true);
    const [metadata, setMetadata] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'split' | 'unified'>('unified');
    const [activeTab, setActiveTab] = useState<'main' | 'annexures'>('main');

    useEffect(() => {
        loadComparison();
    }, [fromVersionId, toVersionId]);

    const loadComparison = async () => {
        setLoading(true);
        try {
            const data = await api.contracts.compare(contractId, fromVersionId, toVersionId);

            const fromMain = stripHtml(data.fromVersion.contentSnapshot?.main || '');
            const toMain = stripHtml(data.toVersion.contentSnapshot?.main || '');
            const fromAnnex = stripHtml(data.fromVersion.contentSnapshot?.annexures || '');
            const toAnnex = stripHtml(data.toVersion.contentSnapshot?.annexures || '');

            setMainDiff(diffLines(fromMain, toMain));
            setAnnexureDiff(diffLines(fromAnnex, toAnnex));
            setMetadata(data);

            const mainChanged = fromMain !== toMain;
            const annexChanged = fromAnnex !== toAnnex;
            if (!mainChanged && annexChanged) {
                setActiveTab('annexures');
            }
        } catch (error) {
            console.error('Failed to load comparison', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Group Changes into Hunks
     */
    const getHunks = (diff: Change[]): Hunk[] => {
        const hunks: Hunk[] = [];
        const CONTEXT_SIZE = 2;

        let currentHunk: Change[] = [];
        let fromLineCounter = 1;
        let toLineCounter = 1;
        let hunkFromStart = 1;
        let hunkToStart = 1;

        diff.forEach((part, i) => {
            const lines = part.value.split('\n');
            if (lines[lines.length - 1] === '') lines.pop();

            const isChange = part.added || part.removed;

            if (isChange) {
                if (currentHunk.length === 0) {
                    hunkFromStart = fromLineCounter;
                    hunkToStart = toLineCounter;
                    const prev = diff[i - 1];
                    if (prev && !prev.added && !prev.removed) {
                        const prevLines = prev.value.split('\n');
                        if (prevLines[prevLines.length - 1] === '') prevLines.pop();
                        const contextLines = prevLines.slice(-CONTEXT_SIZE);
                        currentHunk.push({ ...prev, value: contextLines.join('\n') + '\n' });
                        hunkFromStart -= contextLines.length;
                        hunkToStart -= contextLines.length;
                    }
                }
                currentHunk.push(part);
            } else {
                if (currentHunk.length > 0) {
                    const contextLines = lines.slice(0, CONTEXT_SIZE);
                    currentHunk.push({ ...part, value: contextLines.join('\n') + '\n' });
                    hunks.push({
                        changes: [...currentHunk],
                        fromStartLine: Math.max(1, hunkFromStart),
                        toStartLine: Math.max(1, hunkToStart)
                    });
                    currentHunk = [];
                }
            }
            if (!part.added) fromLineCounter += lines.length;
            if (!part.removed) toLineCounter += lines.length;
        });

        if (currentHunk.length > 0) {
            hunks.push({
                changes: currentHunk,
                fromStartLine: Math.max(1, hunkFromStart),
                toStartLine: Math.max(1, hunkToStart)
            });
        }
        return hunks;
    };

    const currentDiff = activeTab === 'main' ? mainDiff : annexureDiff;
    const hunks = useMemo(() => getHunks(currentDiff), [currentDiff]);
    const activeDiffStats = activeTab === 'main' ? metadata?.mainDiff?.diffStats : metadata?.annexureDiff?.diffStats;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-slate-500 font-medium animate-pulse">Analyzing version differences...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Action Bar */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} size="sm" className="text-slate-500 hover:text-indigo-600">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <button
                            onClick={() => setActiveTab('main')}
                            className={`flex items-center px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'main' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Agreement
                        </button>
                        <button
                            onClick={() => setActiveTab('annexures')}
                            className={`flex items-center px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'annexures' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Annexures
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-1 rounded-xl border border-slate-100 flex gap-1">
                    <Button
                        variant={viewMode === 'unified' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`h-8 px-4 text-xs font-bold rounded-lg ${viewMode === 'unified' ? 'bg-white shadow-sm border border-slate-200 text-indigo-600' : ''}`}
                        onClick={() => setViewMode('unified')}
                    >
                        <BookOpen className="w-3.5 h-3.5 mr-2" /> Reader View
                    </Button>
                    <Button
                        variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`h-8 px-4 text-xs font-bold rounded-lg ${viewMode === 'split' ? 'bg-white shadow-sm border border-slate-200 text-indigo-600' : ''}`}
                        onClick={() => setViewMode('split')}
                    >
                        <Columns className="w-3.5 h-3.5 mr-2" /> Side-by-Side
                    </Button>
                </div>
            </div>

            {/* Stats Summary Area */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500 z-10">v{metadata?.fromVersion.versionNumber}</div>
                        <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white z-20">v{metadata?.toVersion.versionNumber}</div>
                    </div>
                    <p className="text-xs font-bold text-slate-800 tracking-tight">Reviewing {hunks.length} changes</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-600">{activeDiffStats?.additions || 0} additions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-bold text-slate-600">{activeDiffStats?.deletions || 0} deletions</span>
                    </div>
                </div>
            </div>

            {/* Metadata Changes */}
            {metadata?.fieldChanges?.length > 0 && activeTab === 'main' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {metadata.fieldChanges.map((change: any, i: number) => (
                        <div key={i} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm flex flex-col gap-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{change.label}</span>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-rose-500/50 line-through truncate max-w-[40%]">{change.oldValue || 'N/A'}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                                <span className="text-emerald-600 font-bold truncate max-w-[50%]">{change.newValue || 'N/A'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Document Body */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {hunks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">Document is identical</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {hunks.map((hunk, hIdx) => (
                            <div key={hIdx} className="p-10 hover:bg-slate-50/30 transition-colors">
                                <div className="flex items-center gap-3 mb-8 opacity-30">
                                    <div className="h-px bg-slate-200 flex-1" />
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <Hash className="w-2.5 h-2.5" /> Area {hIdx + 1}
                                    </div>
                                    <div className="h-px bg-slate-200 flex-1" />
                                </div>

                                <DiffHunk
                                    hunk={hunk}
                                    viewMode={viewMode}
                                    fromVersion={metadata?.fromVersion.versionNumber}
                                    toVersion={metadata?.toVersion.versionNumber}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Final Summary Card */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-indigo-300">
                        <Eraser className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold">Review Complete?</p>
                        <p className="text-[10px] text-white/50 tracking-tight">You've reached the end of the detected changes for this {activeTab}.</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold px-6 h-8 rounded-full">
                    Confirm Review
                </Button>
            </div>
        </div>
    );
}
