'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContract } from '@/lib/hooks/use-contract';
import { useContractVersions } from '@/lib/hooks/use-contract-versions';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button, Skeleton, Badge } from '@repo/ui';
import { VersionTimeline } from '@/components/contracts/version-timeline';
import { VersionDiffView } from '@/components/contracts/version-diff-view';
import type { Contract, ContractVersion } from '@repo/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ContractVersionsPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: contract, isLoading: contractLoading } = useContract(id);
    const { data: versions, isLoading: versionsLoading } = useContractVersions(id);

    const [fromVersionId, setFromVersionId] = useState<string | null>(null);
    const [toVersionId, setToVersionId] = useState<string | null>(null);
    const [showUploadMenu, setShowUploadMenu] = useState(false);

    type ContractSummary = Contract & { counterparty?: string | null; counterpartyName?: string | null };
    type VersionWithUser = ContractVersion & { createdByUser?: { name?: string | null } | null };

    const versionList = (versions ?? []) as VersionWithUser[];
    const isLoading = contractLoading || versionsLoading;

    // Auto-select last two versions for comparison
    useEffect(() => {
        if (versionList.length >= 2 && !fromVersionId && !toVersionId) {
            setFromVersionId(versionList[1].id); // Second newest (from)
            setToVersionId(versionList[0].id);   // Newest (to)
        } else if (versionList.length === 1 && !toVersionId) {
            setToVersionId(versionList[0].id);
        }
    }, [versionList, fromVersionId, toVersionId]);

    if (isLoading) {
        return (
            <div className="-m-6 h-[calc(100vh-4rem)] flex flex-col">
                <div className="flex-none px-6 py-4 border-b border-neutral-200 bg-white">
                    <Skeleton className="h-8 w-96" />
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <Skeleton className="w-[320px] flex-none" />
                    <Skeleton className="flex-1" />
                </div>
            </div>
        );
    }

    const c = (contract as ContractSummary | null) ?? null;
    const fromVersion = versionList.find((v) => v.id === fromVersionId);
    const toVersion = versionList.find((v) => v.id === toVersionId);

    // Calculate change stats (mock for now)
    const changeStats = {
        additions: 12,
        deletions: 4,
        modifications: 3,
        total: 19,
        current: 2
    };

    return (
        <div className="-m-6 h-[calc(100vh-4rem)] flex flex-col bg-white">
            {/* Header */}
            <header className="flex-none bg-white border-b border-neutral-200 z-50">
                <div className="px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/dashboard/contracts/${id}`)}
                            className="flex items-center justify-center w-8 h-8 rounded hover:bg-neutral-100 text-neutral-500 transition-colors"
                        >
                            <MaterialIcon name="arrow_back" size={20} />
                        </button>
                        <div className="flex flex-col">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <Link href="/dashboard/contracts" className="hover:text-primary-700 cursor-pointer">
                                    Contracts
                                </Link>
                                <span className="text-neutral-300">/</span>
                                <Link href={`/dashboard/contracts/${id}`} className="hover:text-primary-700 cursor-pointer">
                                    {c?.counterparty || 'Contract'}
                                </Link>
                                <span className="text-neutral-300">/</span>
                                <span className="font-medium text-neutral-900">Review & Compare</span>
                            </div>
                            {/* Title and badge */}
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-bold text-neutral-900 leading-tight">
                                    {c?.title || 'Contract Document'}
                                </h1>
                                {fromVersionId && toVersionId && (
                                    <Badge variant="default" className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                                        Comparing Mode
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                            <MaterialIcon name="print" size={20} />
                            <span className="hidden sm:inline">Print Diff</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                            <MaterialIcon name="download" size={20} />
                            <span className="hidden sm:inline">Export Report</span>
                        </Button>

                        {/* Upload dropdown */}
                        <div className="relative">
                            <Button
                                variant="default"
                                size="sm"
                                className="h-9 gap-2 font-bold"
                                onMouseEnter={() => setShowUploadMenu(true)}
                                onMouseLeave={() => setShowUploadMenu(false)}
                            >
                                <MaterialIcon name="upload" size={20} />
                                <span>Upload New Version</span>
                                <MaterialIcon name="expand_more" size={18} className="opacity-80" />
                            </Button>

                            {showUploadMenu && (
                                <div
                                    className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 overflow-hidden ring-1 ring-black/5"
                                    onMouseEnter={() => setShowUploadMenu(true)}
                                    onMouseLeave={() => setShowUploadMenu(false)}
                                >
                                    <div className="p-2 space-y-1">
                                        <button className="flex items-start gap-4 p-3 hover:bg-neutral-50 rounded-lg transition-colors group w-full text-left">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-none group-hover:bg-indigo-100 transition-colors">
                                                <MaterialIcon name="edit_document" size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-neutral-900">Upload Revised Version</span>
                                                <span className="text-xs text-neutral-500 leading-snug mt-1">
                                                    You've made offline edits or received changes from counterparty
                                                </span>
                                            </div>
                                        </button>

                                        <button className="flex items-start gap-4 p-3 hover:bg-neutral-50 rounded-lg transition-colors group w-full text-left">
                                            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-none group-hover:bg-amber-100 transition-colors">
                                                <MaterialIcon name="swap_horiz" size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-neutral-900">Upload Counterparty Response</span>
                                                <span className="text-xs text-neutral-500 leading-snug mt-1">
                                                    Counterparty has sent back a modified version
                                                </span>
                                            </div>
                                        </button>

                                        <div className="h-px bg-neutral-100 my-1 mx-2" />

                                        <button className="flex items-start gap-4 p-3 hover:bg-neutral-50 rounded-lg transition-colors group w-full text-left">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-none group-hover:bg-emerald-100 transition-colors">
                                                <MaterialIcon name="ink_pen" size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-neutral-900">Upload Signed Copy</span>
                                                <span className="text-xs text-neutral-500 leading-snug mt-1">
                                                    Upload a countersigned or fully executed document
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left sidebar - Version History */}
                <aside className="w-[320px] flex-none border-r border-neutral-200 bg-neutral-50 overflow-y-auto flex flex-col z-10">
                    <div className="p-5 border-b border-neutral-200 bg-white sticky top-0 z-10">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                            <MaterialIcon name="history" size={18} />
                            Version History
                        </h2>
                    </div>
                    <VersionTimeline
                        versions={versionList}
                        fromId={fromVersionId}
                        toId={toVersionId}
                        onSelectFrom={setFromVersionId}
                        onSelectTo={setToVersionId}
                    />
                </aside>

                {/* Right section - Comparison view */}
                <section className="flex-1 flex flex-col bg-white relative overflow-hidden">
                    {fromVersion && toVersion ? (
                        <>
                            {/* Comparison toolbar */}
                            <div className="flex-none bg-white border-b border-neutral-200 p-3 shadow-sm z-20">
                                <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                                    {/* From/To selectors */}
                                    <div className="flex items-center gap-3 bg-neutral-50 p-1.5 rounded-lg border border-neutral-200">
                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">From</span>
                                            <select
                                                value={fromVersionId || ''}
                                                onChange={(e) => setFromVersionId(e.target.value)}
                                                aria-label="Select from version"
                                                className="appearance-none bg-transparent pl-2 pr-8 py-1 text-sm font-semibold text-neutral-700 focus:outline-none cursor-pointer"
                                            >
                                                {versionList.map((v) => (
                                                    <option key={v.id} value={v.id}>
                                                        v{v.versionNumber} ({v.createdByUser?.name || 'System'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <MaterialIcon name="arrow_forward" size={20} className="text-neutral-400" />
                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">To</span>
                                            <select
                                                value={toVersionId || ''}
                                                onChange={(e) => setToVersionId(e.target.value)}
                                                aria-label="Select to version"
                                                className="appearance-none bg-transparent pl-2 pr-8 py-1 text-sm font-bold text-primary-700 focus:outline-none cursor-pointer"
                                            >
                                                {versionList.map((v) => (
                                                    <option key={v.id} value={v.id}>
                                                        v{v.versionNumber} {v.id === versionList[0]?.id ? '(Current)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Change stats */}
                                    <div className="flex items-center gap-6 text-sm font-medium">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-50 border border-emerald-100">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-emerald-700">{changeStats.additions} Additions</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-rose-50 border border-rose-100">
                                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                                            <span className="text-rose-700">{changeStats.deletions} Deletions</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-50 border border-amber-100">
                                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                                            <span className="text-amber-700">{changeStats.modifications} Modifications</span>
                                        </div>
                                    </div>

                                    {/* Change navigation */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-neutral-500 font-medium mr-2">
                                            Change {changeStats.current} of {changeStats.total}
                                        </span>
                                        <button className="w-8 h-8 flex items-center justify-center rounded border border-neutral-300 hover:bg-neutral-100 text-neutral-600">
                                            <MaterialIcon name="keyboard_arrow_up" size={20} />
                                        </button>
                                        <button className="w-8 h-8 flex items-center justify-center rounded border border-neutral-300 hover:bg-neutral-100 text-neutral-600">
                                            <MaterialIcon name="keyboard_arrow_down" size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Side-by-side diff view */}
                            <VersionDiffView
                                contractId={id}
                                fromVersion={{ id: fromVersion.id, versionNumber: String(fromVersion.versionNumber) }}
                                toVersion={{ id: toVersion.id, versionNumber: String(toVersion.versionNumber) }}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <MaterialIcon name="compare_arrows" size={48} className="text-neutral-300 mb-4" />
                            <p className="text-base font-medium text-neutral-700 mb-1">
                                Select versions to compare
                            </p>
                            <p className="text-sm text-neutral-500">
                                Choose two versions from the timeline to see their differences
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
