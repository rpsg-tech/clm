'use client';

import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@repo/ui'; // Assuming these exist
import {
    AlertCircle,
    Clock,
    FileText,
    ArrowRight,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AttentionItem {
    id: string;
    type: 'EXPIRING' | 'REJECTED' | 'APPROVAL';
    title: string;
    subtitle: string;
    date?: string | Date;
    priority: 'HIGH' | 'MEDIUM';
    actionLabel: string;
    actionUrl: string;
}

interface AttentionBannerProps {
    expiringContracts?: any[];
    rejectedContracts?: any[];
    pendingApprovals?: any[];
    canViewLegalApprovals?: boolean;
}

export function AttentionBanner({
    expiringContracts = [],
    rejectedContracts = [],
    pendingApprovals = [],
    canViewLegalApprovals
}: AttentionBannerProps) {
    const router = useRouter();

    // Normalizing data
    const items: AttentionItem[] = [
        ...rejectedContracts.map(c => ({
            id: c.id,
            type: 'REJECTED' as const,
            title: c.title,
            subtitle: 'Revision Requested • Check comments',
            priority: 'HIGH' as const,
            actionLabel: 'Revise Draft',
            actionUrl: `/dashboard/contracts/${c.id}`
        })),
        ...pendingApprovals.map(a => ({
            id: a.id,
            type: 'APPROVAL' as const,
            title: a.contractTitle,
            subtitle: `Submitted by ${a.submittedBy}`,
            date: a.submittedAt,
            priority: 'HIGH' as const,
            actionLabel: 'Review Request',
            actionUrl: canViewLegalApprovals ? '/dashboard/approvals/legal' : '/dashboard/approvals/finance'
        })),
        ...expiringContracts.map(c => ({
            id: c.id,
            type: 'EXPIRING' as const,
            title: c.title,
            subtitle: `${c.counterpartyName || 'External Vendor'} • Expires ${new Date(c.endDate).toLocaleDateString()}`,
            date: c.endDate,
            priority: 'MEDIUM' as const,
            actionLabel: 'Review',
            actionUrl: `/dashboard/contracts/${c.id}`
        }))
    ];

    if (items.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="bg-rose-100 p-1.5 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                    </div>
                    Action Center
                    <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">
                        {items.length} Pending
                    </span>
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {items.map((item) => (
                    <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => router.push(item.actionUrl)}
                        className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer overflow-hidden"
                    >
                        {/* Left Border Indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'REJECTED' ? 'bg-rose-500' :
                                item.type === 'APPROVAL' ? 'bg-blue-500' : 'bg-amber-500'
                            }`} />

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                        item.type === 'APPROVAL' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    {item.type === 'REJECTED' && <AlertTriangle size={18} />}
                                    {item.type === 'APPROVAL' && <FileText size={18} />}
                                    {item.type === 'EXPIRING' && <Clock size={18} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                        <span>{item.subtitle}</span>
                                    </div>
                                </div>
                            </div>

                            <Button size="sm" variant="outline" className="bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 group-hover:bg-indigo-50 transition-all">
                                {item.actionLabel}
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
