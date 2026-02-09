'use client';

import { useAuditLogs } from '@/lib/hooks/use-audit-logs';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@repo/ui';

interface ActivityTimelineProps {
    contractId: string;
}

interface AuditLogEntry {
    id: string;
    action: string;
    description?: string;
    comment?: string;
    user?: { name: string; role?: string };
    createdAt: string;
}

const ACTION_STYLES: Record<string, { bg: string; icon: string; label: string }> = {
    APPROVED: { bg: 'bg-emerald-500', icon: 'check_circle', label: 'Approved' },
    LEGAL_APPROVED: { bg: 'bg-emerald-500', icon: 'gavel', label: 'Legal Approved' },
    FINANCE_APPROVED: { bg: 'bg-emerald-500', icon: 'paid', label: 'Finance Approved' },
    SUBMITTED: { bg: 'bg-blue-500', icon: 'send', label: 'Submitted' },
    SENT_TO_LEGAL: { bg: 'bg-blue-500', icon: 'gavel', label: 'Sent to Legal' },
    SENT_TO_FINANCE: { bg: 'bg-blue-500', icon: 'account_balance', label: 'Sent to Finance' },
    UPLOADED: { bg: 'bg-blue-500', icon: 'upload_file', label: 'Uploaded' },
    CREATED: { bg: 'bg-blue-500', icon: 'add_circle', label: 'Created' },
    REJECTED: { bg: 'bg-red-500', icon: 'cancel', label: 'Rejected' },
    REVISION_REQUESTED: { bg: 'bg-red-500', icon: 'rate_review', label: 'Revision Requested' },
    IN_PROGRESS: { bg: 'bg-amber-500', icon: 'pending', label: 'In Progress' },
    PENDING: { bg: 'bg-amber-500', icon: 'pending_actions', label: 'Pending' },
    AWAITING_APPROVAL: { bg: 'bg-amber-500', icon: 'hourglass_empty', label: 'Awaiting Approval' },
};

const DEFAULT_STYLE = { bg: 'bg-neutral-400', icon: 'update', label: 'Updated' };

function getActionStyle(action: string) {
    return ACTION_STYLES[action] || DEFAULT_STYLE;
}

function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

export function ActivityTimeline({ contractId }: ActivityTimelineProps) {
    const { data: logs, isLoading } = useAuditLogs(contractId);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-neutral-900 mb-6">Activity Timeline</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 animate-pulse">
                            <div className="size-3 rounded-full bg-neutral-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-neutral-200 rounded w-1/2" />
                                <div className="h-3 bg-neutral-100 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const entries = (logs || []) as AuditLogEntry[];

    if (entries.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-neutral-900 mb-6">Activity Timeline</h3>
                <div className="text-center py-12">
                    <div className="size-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MaterialIcon name="history" size={24} className="text-neutral-400" />
                    </div>
                    <p className="text-sm text-neutral-500">No activity yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-neutral-900 mb-6">Activity Timeline</h3>

            {/* NOW label */}
            <div className="mb-4">
                <span className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase tracking-wider rounded">
                    NOW
                </span>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[5px] top-0 bottom-0 w-0.5 bg-neutral-200" />

                {/* Events */}
                <div className="space-y-6">
                    {entries.map((entry, idx) => {
                        const style = getActionStyle(entry.action);
                        const isLast = idx === entries.length - 1;

                        return (
                            <div key={entry.id} className="relative pl-6">
                                {/* Dot */}
                                <div
                                    className={cn(
                                        'absolute left-0 top-1 size-3 rounded-full ring-4 ring-white z-10',
                                        style.bg,
                                    )}
                                />

                                {/* Content */}
                                <div className={cn('pb-2', !isLast && 'border-l-0')}>
                                    <div className="flex items-start justify-between gap-4 mb-1">
                                        <h4 className="text-sm font-bold text-neutral-900">
                                            {entry.description || style.label}
                                        </h4>
                                        <span className="text-xs text-neutral-500 whitespace-nowrap flex-shrink-0">
                                            {formatTimestamp(entry.createdAt)}
                                        </span>
                                    </div>

                                    {/* Comment/quote block */}
                                    {entry.comment && (
                                        <div className="mt-2 mb-3 p-3 bg-neutral-50 rounded-lg border-l-2 border-neutral-300">
                                            <p className="text-sm text-neutral-700 leading-relaxed italic">
                                                "{entry.comment}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Actor */}
                                    {entry.user && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="size-6 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-600">
                                                {entry.user.name[0]?.toUpperCase()}
                                            </div>
                                            <div className="text-xs text-neutral-600">
                                                <span className="font-medium">{entry.user.name}</span>
                                                {entry.user.role && (
                                                    <span className="text-neutral-500"> • {entry.user.role}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
