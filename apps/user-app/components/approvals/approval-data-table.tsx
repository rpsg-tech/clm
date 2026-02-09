'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Checkbox } from '@repo/ui';
import { ApprovalActionsCell } from './approval-actions-cell';
import { ArrowUpDown, FileText, User, Clock, ChevronRight } from 'lucide-react';

interface Approval {
    id: string;
    type: string;
    status: string;
    createdAt: string;
    contract: {
        id: string;
        title: string;
        reference: string;
        createdByUser: {
            name: string;
        };
    };
}

interface ApprovalDataTableProps {
    data: Approval[];
    onApprove: (id: string, comment?: string) => Promise<void>;
    onReject: (id: string, comment: string) => Promise<void>;
    onBulkApprove: (ids: string[], comment?: string) => Promise<void>;
    onView: (id: string) => void;
    isLoading: boolean;
}

export function ApprovalDataTable({ data, onApprove, onReject, onBulkApprove, onView, isLoading }: ApprovalDataTableProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const toggleSelectAll = () => {
        if (selectedIds.length === data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(data.map(d => d.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(s => s !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const timeSince = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    return (
        <div className="w-full">
            {/* Bulk Actions Header */}
            {selectedIds.length > 0 && (
                <div className="bg-slate-900 text-white px-4 py-2 rounded-t-lg flex items-center justify-between mb-0 animate-in slide-in-from-bottom-2 fade-in">
                    <span className="text-sm font-semibold">{selectedIds.length} items selected</span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-slate-800 h-8 text-xs font-bold uppercase tracking-wider"
                            onClick={() => setSelectedIds([])}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 h-8 text-xs font-bold uppercase tracking-wider"
                            onClick={() => onBulkApprove(selectedIds)}
                        >
                            Approve Selected
                        </Button>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium uppercasetracking-wider text-[10px]">
                        <tr>
                            <th className="p-4 w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 w-4 h-4 cursor-pointer"
                                    checked={data.length > 0 && selectedIds.length === data.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="p-4 font-bold uppercase tracking-wider text-[10px] w-1/3">Contract Reference</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Submitted By</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Pending For</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((item) => (
                            <tr
                                key={item.id}
                                className={`group transition-colors hover:bg-slate-50/50 cursor-pointer ${selectedIds.includes(item.id) ? 'bg-blue-50/30' : ''}`}
                                onClick={() => onView(item.id)}
                            >
                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 w-4 h-4 cursor-pointer"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => toggleSelect(item.id)}
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.contract.title}</span>
                                        <span className="text-[10px] font-mono text-slate-400 mt-0.5">{item.contract.reference}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px]">
                                            {item.contract.createdByUser.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-slate-700">{item.contract.createdByUser.name}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Clock className="w-3.5 h-3.5 opacity-70" />
                                        <span className="font-medium text-xs">{timeSince(item.createdAt)} ago</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <ApprovalActionsCell
                                            approvalId={item.id}
                                            onApprove={(id) => onApprove(id)}
                                            onReject={(id) => onReject(id, "Rejected via Quick Action")}
                                            isLoading={isLoading}
                                        />
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-300 group-hover:text-slate-600">
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {data.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        <p className="text-sm font-medium">No pending approvals found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
