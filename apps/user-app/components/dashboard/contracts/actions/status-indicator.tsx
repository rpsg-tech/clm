import { Clock } from "lucide-react";

interface StatusIndicatorProps {
    status: string;
    compact?: boolean;
}

export function StatusIndicator({ status, compact = false }: StatusIndicatorProps) {
    // Color mapping for each status
    const statusColors: Record<string, string> = {
        DRAFT: 'bg-orange-500',
        REVISION_REQUESTED: 'bg-amber-500',
        IN_REVIEW: 'bg-blue-500',
        SENT_TO_LEGAL: 'bg-indigo-500',
        SENT_TO_FINANCE: 'bg-cyan-500',
        APPROVED: 'bg-green-500',
        SENT_TO_COUNTERPARTY: 'bg-purple-500',
        ACTIVE: 'bg-emerald-500',
        CANCELLED: 'bg-red-500',
        PENDING_LEGAL_HEAD: 'bg-indigo-600',
        FINANCE_REVIEW_IN_PROGRESS: 'bg-cyan-600',
        LEGAL_REVIEW_IN_PROGRESS: 'bg-indigo-600',
        REJECTED: 'bg-red-600',
    };

    // Determine if status should pulse (active/in-progress states)
    const shouldPulse = !['ACTIVE', 'CANCELLED', 'REJECTED', 'EXECUTED', 'EXPIRED', 'TERMINATED'].includes(status);

    // Get color class, default to slate if status not mapped
    const colorClass = statusColors[status] || 'bg-slate-400';

    // Format status for display (replace underscores with spaces, title case)
    const displayStatus = status
        .split('_')
        .map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');

    return (
        <div className={`flex ${compact ? 'flex-row items-center gap-3' : 'flex-col gap-1.5'} min-w-[140px]`}>
            {!compact && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={10} />
                    Current Stage
                </span>
            )}
            <div className={`
                flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all duration-300
                ${shouldPulse ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100'}
                ${compact ? 'h-9 shadow-sm bg-white border-slate-200' : 'w-fit'}
            `}>
                <div className={`relative flex items-center justify-center w-2.5 h-2.5`}>
                    <div className={`relative w-2.5 h-2.5 rounded-full ${colorClass}`} />
                </div>
                <span className="text-sm font-bold text-slate-800 tracking-tight">{displayStatus}</span>
            </div>
        </div>
    );
}
