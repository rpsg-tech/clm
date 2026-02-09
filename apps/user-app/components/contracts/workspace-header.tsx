'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@repo/ui';
import type { Contract } from '@repo/types';

interface WorkspaceHeaderProps {
    contract: Contract;
    isSaving: boolean;
    lastSaved: Date | null;
    canEdit: boolean;
    isLegal: boolean;
    onSubmit: () => void;
    onToggleAi: () => void;
    showAiPanel: boolean;
    onUploadVersion: () => void;
}

function formatTimeSince(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function WorkspaceHeader({
    contract,
    isSaving,
    lastSaved,
    canEdit,
    isLegal,
    onSubmit,
    onToggleAi,
    showAiPanel,
    onUploadVersion,
}: WorkspaceHeaderProps) {
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white flex-shrink-0 z-20 shadow-sm">
            {/* Left: Back + title */}
            <div className="flex items-center gap-4 min-w-0">
                <Link
                    href={`/dashboard/contracts/${contract.id}`}
                    className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-all flex-shrink-0"
                    title="Back to Details"
                >
                    <MaterialIcon name="arrow_back" size={20} />
                </Link>
                <div className="min-w-0 border-l border-neutral-200 pl-4">
                    <h1 className="text-base font-bold text-neutral-900 truncate leading-tight">
                        {contract.title}
                    </h1>
                    {contract.reference && (
                        <p className="text-xs text-neutral-500 font-mono mt-0.5 tracking-wide">{contract.reference}</p>
                    )}
                </div>
            </div>

            {/* Center: Save status */}
            <div className="hidden md:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-100">
                {isSaving ? (
                    <>
                        <MaterialIcon name="sync" size={14} className="animate-spin text-primary-600" />
                        <span className="text-primary-700">Saving changes...</span>
                    </>
                ) : lastSaved ? (
                    <>
                        <MaterialIcon name="cloud_done" size={14} className="text-success" />
                        <span className="text-neutral-600">Saved {formatTimeSince(lastSaved)}</span>
                    </>
                ) : canEdit ? (
                    <>
                        <MaterialIcon name="edit" size={14} className="text-neutral-400" />
                        <span className="text-neutral-500">Unsaved changes</span>
                    </>
                ) : (
                    <>
                        <MaterialIcon name="lock" size={14} className="text-neutral-400" />
                        <span className="text-neutral-500">Read-only Mode</span>
                    </>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {!isLegal && (
                    <button
                        onClick={onUploadVersion}
                        className="hidden sm:inline-flex items-center gap-1.5 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 font-medium py-2 px-3 rounded-lg text-sm transition-all shadow-sm"
                    >
                        <MaterialIcon name="upload_file" size={18} />
                        <span className="hidden lg:inline">Upload Version</span>
                    </button>
                )}

                <button
                    onClick={onToggleAi}
                    className={cn(
                        "p-2 rounded-lg transition-all duration-200 border",
                        showAiPanel
                            ? "bg-violet-50 text-violet-700 border-violet-200 shadow-inner"
                            : "bg-white text-neutral-500 border-transparent hover:bg-neutral-100 hover:text-neutral-900"
                    )}
                    title={showAiPanel ? 'Hide AI Assistant' : 'Show AI Assistant'}
                >
                    <MaterialIcon name="smart_toy" size={20} />
                </button>

                {canEdit && (
                    <button
                        onClick={onSubmit}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/30 active:scale-95 ml-2"
                    >
                        <MaterialIcon name="send" size={16} />
                        <span>Submit</span>
                    </button>
                )}
            </div>
        </div>
    );
}
