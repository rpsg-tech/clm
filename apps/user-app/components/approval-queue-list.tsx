import React from 'react';
import { Badge } from '@repo/ui';
import { MaterialIcon } from '@/components/ui/material-icon';

export interface ApprovalItem {
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
            email: string;
        };
    };
}

interface ApprovalQueueListProps {
    approvals: ApprovalItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    title?: string;
}

export const ApprovalQueueList: React.FC<ApprovalQueueListProps> = ({
    approvals,
    selectedId,
    onSelect,
    title = "Approval Queue"
}) => {
    const timeSince = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-white">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                    {approvals.length} PENDING ITEMS
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {approvals.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <MaterialIcon name="check_circle" className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-xs font-medium text-slate-500">All caught up!</p>
                    </div>
                ) : (
                    approvals.map((approval) => (
                        <div
                            key={approval.id}
                            onClick={() => onSelect(approval.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group relative ${selectedId === approval.id
                                    ? 'bg-white border-indigo-600 ring-1 ring-indigo-600 shadow-md z-10'
                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold text-xs line-clamp-2 leading-snug ${selectedId === approval.id ? 'text-indigo-900' : 'text-slate-900'
                                    }`}>
                                    {approval.contract.title}
                                </h3>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center text-[10px] font-bold text-slate-500">
                                    <MaterialIcon name="person" className="w-3 h-3 mr-1.5 opacity-70" />
                                    {approval.contract.createdByUser.name}
                                </div>
                                <div className="flex items-center text-[10px] font-medium text-slate-400">
                                    <MaterialIcon name="schedule" className="w-3 h-3 mr-1.5 opacity-70" />
                                    {timeSince(approval.createdAt)} • <span className="font-mono ml-1 opacity-70">{approval.contract.reference}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
