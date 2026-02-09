'use client';

import { useState, useEffect } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { VersionDiffView } from '@/components/contracts/version-diff-view';
import { mockVersionSummary, mockChangeSummary } from '@/lib/ai-mock';
import { cn } from '@repo/ui';
import type { ContractVersion } from '@repo/types';

type Tab = 'overview' | 'changes';

interface VersionDetailPanelProps {
    contractId: string;
    version: (ContractVersion & { createdByUser?: { name?: string } }) | null;
    previousVersion: (ContractVersion & { createdByUser?: { name?: string } }) | null;
}

export function VersionDetailPanel({
    contractId,
    version,
    previousVersion,
}: VersionDetailPanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [changeImpact, setChangeImpact] = useState<string[]>([]);
    const [isLoadingAi, setIsLoadingAi] = useState(false);

    // Load AI summaries when version changes
    useEffect(() => {
        if (!version) return;

        setIsLoadingAi(true);
        setAiSummary(null);
        setChangeImpact([]);

        // TODO: Replace with real AI API calls
        Promise.all([
            mockVersionSummary(version.versionNumber),
            mockChangeSummary(version.versionNumber),
        ])
            .then(([summary, changes]) => {
                setAiSummary(summary);
                setChangeImpact(changes);
            })
            .finally(() => setIsLoadingAi(false));
    }, [version?.id]);

    if (!version) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MaterialIcon name="touch_app" size={40} className="text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-500">Select a version to view details</p>
            </div>
        );
    }

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'overview', label: 'Overview', icon: 'info' },
        { key: 'changes', label: 'Changes', icon: 'difference' },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Version header */}
            <div className="px-6 py-4 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-700">
                            v{version.versionNumber}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-neutral-900">
                            Version {version.versionNumber}
                        </h2>
                        <p className="text-xs text-neutral-500">
                            {version.createdByUser?.name ?? 'System'} &middot;{' '}
                            {version.createdAt
                                ? new Date(version.createdAt).toLocaleDateString()
                                : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 px-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                            activeTab === tab.key
                                ? 'border-indigo-600 text-indigo-700'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        )}
                    >
                        <MaterialIcon name={tab.icon} size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="p-6 space-y-6">
                        {/* AI Executive Summary */}
                        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MaterialIcon
                                    name="auto_awesome"
                                    size={16}
                                    className="text-violet-600"
                                />
                                <h3 className="text-sm font-semibold text-violet-800">
                                    AI Summary
                                </h3>
                            </div>
                            {isLoadingAi ? (
                                <div className="flex items-center gap-2 text-sm text-violet-500">
                                    <MaterialIcon
                                        name="auto_awesome"
                                        size={14}
                                        className="animate-pulse"
                                    />
                                    Generating summary...
                                </div>
                            ) : (
                                <p className="text-sm text-violet-900">{aiSummary}</p>
                            )}
                        </div>

                        {/* Change Impact */}
                        {changeImpact.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                                    Key Changes
                                </h3>
                                <ul className="space-y-2">
                                    {changeImpact.map((change, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2 text-sm text-neutral-700"
                                        >
                                            <MaterialIcon
                                                name="arrow_right"
                                                size={16}
                                                className="text-indigo-500 mt-0.5 flex-shrink-0"
                                            />
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Version metadata */}
                        <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-neutral-900">Details</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-neutral-400">Created By</p>
                                    <p className="text-neutral-700">
                                        {version.createdByUser?.name ?? 'System'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400">Created At</p>
                                    <p className="text-neutral-700">
                                        {version.createdAt
                                            ? new Date(version.createdAt).toLocaleString()
                                            : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400">Version Number</p>
                                    <p className="text-neutral-700">{version.versionNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400">Previous Version</p>
                                    <p className="text-neutral-700">
                                        {previousVersion
                                            ? `v${previousVersion.versionNumber}`
                                            : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'changes' && (
                    <div>
                        {previousVersion ? (
                            <VersionDiffView
                                contractId={contractId}
                                fromVersion={{ id: previousVersion.id, versionNumber: String(previousVersion.versionNumber) }}
                                toVersion={{ id: version.id, versionNumber: String(version.versionNumber) }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <MaterialIcon
                                    name="first_page"
                                    size={36}
                                    className="text-neutral-300 mb-3"
                                />
                                <p className="text-sm text-neutral-500">
                                    This is the first version — no prior changes to compare.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
