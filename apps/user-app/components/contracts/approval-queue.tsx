'use client';

import { useState } from 'react';
import { useApprovals } from '@/lib/hooks/use-approvals';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Skeleton } from '@repo/ui';
import type { Approval, Contract } from '@repo/types';

/** Approval with embedded contract relation as returned by the pending endpoint */
interface ApprovalWithContract extends Approval {
    contract?: Pick<Contract, 'title' | 'counterpartyName' | 'reference' | 'status'>;
}

interface ApprovalQueueProps {
    type: 'LEGAL' | 'FINANCE';
    selectedId: string | null;
    onSelect: (approval: ApprovalWithContract) => void;
}

function timeAgo(dateValue: string | Date): string {
    const seconds = Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function getPriority(approval: ApprovalWithContract): 'Overdue' | 'Expiring Soon' | 'Normal' {
    if (!approval.dueDate) return 'Normal';
    const due = new Date(approval.dueDate).getTime();
    const now = Date.now();
    if (due < now) return 'Overdue';
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (due - now < threeDays) return 'Expiring Soon';
    return 'Normal';
}

function getInitials(title: string): string {
    return title
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0] ?? '')
        .join('')
        .toUpperCase();
}

const avatarColors = [
    'bg-neutral-100 text-neutral-600',
    'bg-emerald-100 text-emerald-700',
    'bg-indigo-100 text-indigo-700',
    'bg-amber-100 text-amber-700',
];

export function ApprovalQueue({ type, selectedId, onSelect }: ApprovalQueueProps) {
    const { data, isLoading } = useApprovals(type);
    const approvals = (data as ApprovalWithContract[]) ?? [];
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? approvals.filter((a: ApprovalWithContract) => {
              const title = (a.contract?.title ?? '').toLowerCase();
              const counterparty = (a.contract?.counterpartyName ?? '').toLowerCase();
              const q = search.toLowerCase();
              return title.includes(q) || counterparty.includes(q);
          })
        : approvals;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-5 pb-2 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-neutral-900">Review Queue</h2>
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                        {approvals.length} Pending
                    </span>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <MaterialIcon
                        name="search"
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search contracts..."
                        aria-label="Search contracts"
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                    />
                </div>

                {/* Sort / Filter row */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <span className="text-xs text-neutral-500">
                        Sort by: <span className="font-medium text-neutral-700">Priority</span>
                    </span>
                    <button aria-label="Filter approvals" className="text-neutral-400 hover:text-neutral-600 transition-colors">
                        <MaterialIcon name="filter_list" size={18} />
                    </button>
                </div>
            </div>

            {/* Queue items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {isLoading ? (
                    <div className="space-y-3 p-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 rounded-lg" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <div className="size-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                            <MaterialIcon name="check_circle" size={28} className="text-emerald-400" />
                        </div>
                        <p className="text-sm text-neutral-600 font-semibold">All caught up</p>
                        <p className="text-xs text-neutral-400 mt-1">
                            {search.trim() ? 'No matching approvals found' : 'No pending approvals'}
                        </p>
                    </div>
                ) : (
                    filtered.map((approval: ApprovalWithContract, index: number) => {
                        const isSelected = selectedId === approval.id;
                        const contract = approval.contract;
                        const title = contract?.title ?? 'Untitled Contract';
                        const counterparty = contract?.counterpartyName ?? 'Unknown';
                        const date = approval.createdAt ? timeAgo(approval.createdAt) : '';
                        const priority = getPriority(approval);
                        const initials = getInitials(title);
                        const colorClass = isSelected
                            ? 'bg-white text-indigo-700 border border-indigo-100'
                            : avatarColors[index % avatarColors.length];

                        return (
                            <button
                                key={approval.id}
                                onClick={() => onSelect(approval)}
                                className={`group w-full text-left p-3 rounded-lg transition-all ${
                                    isSelected
                                        ? 'bg-indigo-50/50 border-2 border-indigo-600 shadow-sm'
                                        : 'border-2 border-transparent hover:bg-neutral-50 hover:border-neutral-200'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div
                                        className={`size-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colorClass}`}
                                    >
                                        {initials}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={`text-sm leading-tight truncate ${
                                                isSelected
                                                    ? 'font-bold text-neutral-900'
                                                    : 'font-medium text-neutral-900 group-hover:text-indigo-600 transition-colors'
                                            }`}
                                        >
                                            {title}
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-0.5 truncate">
                                            {counterparty} &bull; {date}
                                        </p>
                                    </div>
                                </div>

                                {/* Priority badge row */}
                                <div className="pl-12 mt-1.5 flex items-center justify-between">
                                    {priority === 'Overdue' && (
                                        <>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-100 text-red-700">
                                                Overdue
                                            </span>
                                            <span className="flex items-center gap-1 text-red-600">
                                                <MaterialIcon name="warning" size={12} />
                                                <span className="text-[10px] font-bold">Action Req.</span>
                                            </span>
                                        </>
                                    )}
                                    {priority === 'Expiring Soon' && (
                                        <>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                                                Expiring Soon
                                            </span>
                                            <span className="flex items-center gap-1 text-amber-600">
                                                <MaterialIcon name="schedule" size={12} />
                                                <span className="text-[10px] font-bold">&gt; 3d left</span>
                                            </span>
                                        </>
                                    )}
                                    {priority === 'Normal' && (
                                        <>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500">
                                                Normal
                                            </span>
                                            <span className="flex items-center gap-1 text-neutral-400">
                                                <MaterialIcon name="calendar_today" size={12} />
                                                <span className="text-[10px] font-bold">5d left</span>
                                            </span>
                                        </>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
