'use client';

import { MaterialIcon } from '@/components/ui/material-icon';
import type { ContractVersion } from '@repo/types';

type VersionWithUser = ContractVersion & {
    createdByUser?: { name?: string | null } | null;
    note?: string | null;
};

interface VersionTimelineProps {
    versions: VersionWithUser[];
    fromId: string | null;
    toId: string | null;
    onSelectFrom: (id: string) => void;
    onSelectTo: (id: string) => void;
}

export function VersionTimeline({
    versions,
    fromId,
    toId,
    onSelectFrom,
    onSelectTo
}: VersionTimelineProps) {
    if (versions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MaterialIcon name="history" size={36} className="text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-500">No versions yet</p>
            </div>
        );
    }

    const getInitials = (name: string): string => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="p-5 relative min-h-full">
            {/* Timeline connector line */}
            <div className="absolute left-[29px] top-6 bottom-0 w-[2px] bg-neutral-200" />

            <div className="space-y-6">
                {versions.map((version, index: number) => {
                    const isCurrent = index === 0;
                    const isFromVersion = fromId === version.id;
                    const isToVersion = toId === version.id;
                    const isSelected = isFromVersion || isToVersion;
                    const userName = version.createdByUser?.name ?? 'System';
                    const isSystemVersion = userName === 'System';

                    // Opacity levels for visual hierarchy
                    const opacity = isCurrent ? 'opacity-100' : index === 1 ? 'opacity-75' : 'opacity-50';
                    const hoverOpacity = 'hover:opacity-100';

                    return (
                        <div
                            key={version.id}
                            className={`relative pl-8 group cursor-pointer ${opacity} ${hoverOpacity} transition-all`}
                            onClick={() => {
                                // If clicking current selection, do nothing
                                if (isToVersion) return;

                                // Smart selection: if neither is selected, set as "from"
                                // if "from" is selected, set as "to"
                                if (!fromId && !toId) {
                                    onSelectFrom(version.id);
                                } else if (fromId && !toId) {
                                    onSelectTo(version.id);
                                } else {
                                    // Both selected, clicking changes "from"
                                    onSelectFrom(version.id);
                                }
                            }}
                        >
                            {/* Timeline dot */}
                            <div
                                className={`absolute left-1 top-1 w-4 h-4 rounded-full z-10 shadow-sm transition-colors ${
                                    isCurrent
                                        ? 'bg-primary-700 ring-4 ring-white'
                                        : isSelected
                                        ? 'bg-neutral-400 ring-4 ring-white group-hover:bg-neutral-500'
                                        : 'bg-neutral-300 ring-4 ring-white group-hover:bg-neutral-400'
                                }`}
                            />

                            {/* Version card */}
                            <div
                                className={`bg-white rounded-lg p-3 shadow-sm border transition-all ${
                                    isCurrent
                                        ? 'border-l-4 border-primary-700 shadow-md'
                                        : isSelected
                                        ? 'border border-neutral-300 hover:border-indigo-300'
                                        : 'border border-neutral-200 hover:border-neutral-300'
                                } ${isCurrent ? '' : 'hover:shadow-lg'}`}
                            >
                                {/* Version number and badge */}
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-base font-bold ${isCurrent ? 'text-neutral-900' : 'text-neutral-700'}`}>
                                        v{version.versionNumber}
                                    </span>
                                    {isCurrent && (
                                        <span className="bg-indigo-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                            Current
                                        </span>
                                    )}
                                    {isFromVersion && !isCurrent && (
                                        <span className="text-[10px] font-medium text-neutral-400">
                                            Selected
                                        </span>
                                    )}
                                </div>

                                {/* Date and time */}
                                <p className="text-xs text-neutral-500 mb-2">
                                    {version.createdAt
                                        ? new Date(version.createdAt).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric',
                                          }) + ' • ' + new Date(version.createdAt).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : '—'}
                                </p>

                                {/* User info */}
                                <div className="flex items-center gap-2 mb-2">
                                    {isSystemVersion ? (
                                        <MaterialIcon name="smart_toy" size={16} className="text-neutral-400" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-bold">
                                            {getInitials(userName)}
                                        </div>
                                    )}
                                    <span className="text-xs font-medium text-neutral-700">
                                        {userName}
                                    </span>
                                </div>

                                {/* Note */}
                                {version.note && (
                                    <div className="text-[10px] font-medium text-neutral-400">
                                        {version.note}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
