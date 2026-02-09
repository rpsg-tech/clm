'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { getStatusDisplay } from '@/lib/status-utils';
import { cn, Skeleton } from '@repo/ui';
import type { ContractStatus } from '@repo/types';

interface ContractTableRow {
    id: string;
    title: string;
    counterpartyName?: string;
    status: ContractStatus;
    createdAt: string;
    endDate?: string;
    amount?: number;
    createdByUser?: { name: string };
    template?: { name: string; category?: string };
}

interface ContractTableProps {
    contracts: ContractTableRow[];
    isLoading?: boolean;
    emptyMessage?: string;
}

export function ContractTable({ contracts, isLoading, emptyMessage = 'No contracts found.' }: ContractTableProps) {
    if (isLoading) {
        return (
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (contracts.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-12 text-center">
                <MaterialIcon name="description" size={36} className="text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">{emptyMessage}</p>
            </div>
        );
    }

    const formatINR = (amount: number) => {
        if (typeof amount !== 'number' || isNaN(amount)) return '—';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getInitials = (name: string) => {
        if (!name || !name.trim()) return '??';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getFirstName = (name: string) => {
        if (!name || !name.trim()) return '—';
        return name.trim().split(' ')[0];
    };

    return (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full" aria-label="Contracts list">
                <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50">
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                            Agreement
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                            Template
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                            Amount
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                            Created
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                            Expiry
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                            Owner
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                    {contracts.map((contract) => {
                        const statusDisplay = getStatusDisplay(contract.status);

                        return (
                            <tr
                                key={contract.id}
                                className="hover:bg-neutral-50 transition-colors"
                            >
                                {/* Status */}
                                <td className="px-4 py-4">
                                    <span
                                        className={cn(
                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                            statusDisplay.bg,
                                            statusDisplay.text
                                        )}
                                    >
                                        {statusDisplay.label}
                                    </span>
                                </td>

                                {/* Agreement (name + counterparty) */}
                                <td className="px-4 py-4">
                                    <Link
                                        href={`/dashboard/contracts/${contract.id}`}
                                        className="block"
                                    >
                                        <p className="text-sm font-semibold text-neutral-900 hover:text-indigo-600 transition-colors">
                                            {contract.title}
                                        </p>
                                        {contract.counterpartyName && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <MaterialIcon name="business" size={14} className="text-neutral-400" />
                                                <span className="text-xs text-neutral-500">
                                                    {contract.counterpartyName}
                                                </span>
                                            </div>
                                        )}
                                    </Link>
                                </td>

                                {/* Template */}
                                <td className="px-4 py-4">
                                    <span className="text-sm text-neutral-600">
                                        {contract.template?.name || '—'}
                                    </span>
                                </td>

                                {/* Amount (INR) */}
                                <td className="px-4 py-4">
                                    <span className="text-sm text-neutral-600">
                                        {contract.amount ? formatINR(contract.amount) : '—'}
                                    </span>
                                </td>

                                {/* Created */}
                                <td className="px-4 py-4">
                                    <span className="text-sm text-neutral-500">
                                        {formatDate(contract.createdAt)}
                                    </span>
                                </td>

                                {/* Expiry */}
                                <td className="px-4 py-4">
                                    <span className="text-sm text-neutral-500">
                                        {contract.endDate ? formatDate(contract.endDate) : '—'}
                                    </span>
                                </td>

                                {/* Owner */}
                                <td className="px-4 py-4">
                                    {contract.createdByUser?.name ? (
                                        <div className="flex items-center gap-2">
                                            <div className="size-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                                {getInitials(contract.createdByUser.name)}
                                            </div>
                                            <span className="text-sm text-neutral-600">
                                                {getFirstName(contract.createdByUser.name)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-neutral-400">—</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
