'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, Badge, Skeleton, Button, Input } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import {
    X,
    Search,
    Filter,
    Clock,
    FileText,
    User,
    Shield,
    Activity,
    ArrowRight,
    LayoutTemplate,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    module: string;
    targetType: string | null;
    targetId: string | null;
    oldValue: Record<string, unknown> | null;
    newValue: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
    ipAddress: string | null;
    createdAt: string;
    user: { name: string; email: string };
}

const actionIcons: Record<string, any> = {
    CONTRACT_CREATED: FileText,
    CONTRACT_UPDATED: FileText,
    CONTRACT_SUBMITTED: ArrowRight,
    CONTRACT_APPROVED: CheckCircle,
    CONTRACT_REJECTED: X,
    USER_LOGIN: User,
    USER_LOGOUT: User,
    ROLE_ASSIGNED: Shield,
    TEMPLATE_CREATED: LayoutTemplate,
};

const actionColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
    CONTRACT_CREATED: 'success',
    CONTRACT_UPDATED: 'info',
    CONTRACT_SUBMITTED: 'warning',
    CONTRACT_APPROVED: 'success',
    CONTRACT_REJECTED: 'error',
    USER_LOGIN: 'secondary',
    USER_LOGOUT: 'secondary',
    ROLE_ASSIGNED: 'info',
    TEMPLATE_CREATED: 'success',
};

export default function AuditLogPage() {
    const { currentOrg, hasPermission, isAuthenticated } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');

    // Get filter params from URL
    const urlTargetId = searchParams.get('targetId');
    const urlTargetType = searchParams.get('targetType');
    const [targetIdFilter, setTargetIdFilter] = useState(urlTargetId || '');
    const [targetTypeFilter, setTargetTypeFilter] = useState(urlTargetType || '');

    // Check if user has permission to view audit logs
    const canViewAudit = hasPermission('system:audit');

    useEffect(() => {
        const fetchLogs = async () => {
            if (!isAuthenticated || !currentOrg) return;

            if (!canViewAudit) {
                setError('You do not have permission to view audit logs.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const response = await api.audit.getLogs({
                    take: 50,
                    module: moduleFilter || undefined,
                });
                setLogs(response.logs);
            } catch (error: any) {
                console.error('Failed to fetch audit logs:', error);

                if (error?.status === 403) {
                    setError('You do not have permission to view audit logs. Please contact your administrator.');
                } else if (error?.status === 429) {
                    const retryAfter = error?.data?.retryAfter || 60;
                    setError(`Rate limit exceeded. Retrying in ${retryAfter} seconds...`);
                    setTimeout(() => fetchLogs(), retryAfter * 1000);
                } else {
                    setError(error?.message || 'Failed to load audit logs. Please try again.');
                }
                setLogs([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [currentOrg, moduleFilter, canViewAudit, isAuthenticated]);

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesModule = !moduleFilter || log.module === moduleFilter;
        const matchesTargetId = !targetIdFilter || log.targetId === targetIdFilter;
        const matchesTargetType = !targetTypeFilter || log.targetType === targetTypeFilter;

        return matchesSearch && matchesModule && matchesTargetId && matchesTargetType;
    });

    const clearTargetFilter = () => {
        setTargetIdFilter('');
        setTargetTypeFilter('');
        router.push('/dashboard/audit');
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };

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
        <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Audit Log</h1>
                <p className="mt-2 text-neutral-500">
                    Track all actions and changes in <span className="font-medium text-neutral-900">{currentOrg?.name}</span>
                </p>

                {/* Active Filters */}
                {(targetIdFilter || targetTypeFilter) && (
                    <div className="mt-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <Badge variant="info" className="inline-flex items-center gap-2 pl-3 pr-1 py-1 text-sm font-medium">
                            <span>Filtered by {targetTypeFilter || 'Target'}</span>
                            <button
                                onClick={clearTargetFilter}
                                className="hover:bg-white/20 rounded-full p-1 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                        <span className="text-sm text-neutral-500">
                            Showing {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
                        </span>
                    </div>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-red-900">Access Denied</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-neutral-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search by action, user, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-transparent border-none text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-0"
                    />
                </div>
                <div className="h-6 w-px bg-neutral-200 hidden md:block" />
                <div className="flex items-center gap-3 w-full md:w-auto px-2">
                    <Filter className="w-4 h-4 text-neutral-400" />
                    <select
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                        className="bg-transparent border-none text-sm font-medium text-neutral-700 focus:ring-0 cursor-pointer min-w-[140px]"
                    >
                        <option value="">All Modules</option>
                        <option value="contracts">Contracts</option>
                        <option value="approvals">Approvals</option>
                        <option value="auth">Authentication</option>
                        <option value="templates">Templates</option>
                        <option value="users">Users</option>
                    </select>
                </div>
            </div>

            {/* Audit Log Timeline */}
            <Card className="border-none shadow-sm bg-transparent">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-12 flex justify-center pt-2">
                                        <Skeleton className="w-3 h-3 rounded-full" />
                                    </div>
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-neutral-200 border-dashed">
                            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-4">
                                <Activity className="w-8 h-8 text-neutral-400" />
                            </div>
                            <p className="text-lg font-medium text-neutral-900">No activity found</p>
                            <p className="text-neutral-500 mt-1">Try adjusting your filters or search terms.</p>
                            <Button
                                variant="outline"
                                onClick={() => { setSearchQuery(''); setModuleFilter(''); }}
                                className="mt-6"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        <div className="relative pl-4 space-y-8">
                            {/* Timeline line */}
                            <div className="absolute left-[29px] top-4 bottom-4 w-px bg-neutral-200" />

                            {filteredLogs.map((log) => {
                                const Icon = actionIcons[log.action] || Activity;
                                return (
                                    <div key={log.id} className="relative flex gap-6 group">
                                        {/* Timeline Icon */}
                                        <div className="relative z-10 flex-shrink-0">
                                            <div className="w-[30px] h-[30px] rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-sm group-hover:border-primary-200 group-hover:bg-primary-50 transition-colors">
                                                <Icon className="w-3.5 h-3.5 text-neutral-500 group-hover:text-primary-600" />
                                            </div>
                                        </div>

                                        {/* Content Card */}
                                        <div className="flex-1 bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-all duration-200">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant={actionColors[log.action] || 'secondary'} className="text-[10px] h-5 px-2">
                                                            {/* Enhanced Action Label with Metadata */}
                                                            {(log.action === 'CONTRACT_APPROVED' || log.action === 'CONTRACT_REJECTED') && (log as any).metadata?.type
                                                                ? `${String((log as any).metadata.type)} ${log.action === 'CONTRACT_APPROVED' ? 'Approved' : 'Rejected'}`
                                                                : formatAction(log.action)}
                                                        </Badge>
                                                        <span className="text-xs text-neutral-400 font-medium uppercase tracking-wide">
                                                            {log.module}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-neutral-900">
                                                        <span className="font-semibold">{log.user.name}</span>
                                                        <span className="text-neutral-500"> ({log.user.email})</span>
                                                    </p>
                                                    {/* Display extra context if available */}
                                                    {((log as any).metadata?.comment || (log as any).metadata?.reason) && (
                                                        <p className="text-xs text-neutral-500 mt-1 italic">
                                                            "{String((log as any).metadata.comment || (log as any).metadata.reason)}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-neutral-400 whitespace-nowrap bg-neutral-50 px-2 py-1 round-lg rounded-md">
                                                    <Clock className="w-3 h-3" />
                                                    {timeSince(log.createdAt)}
                                                </div>
                                            </div>

                                            {/* Changes Diff */}
                                            {(log.oldValue || log.newValue) && (
                                                <div className="mt-4 bg-neutral-50 rounded-lg border border-neutral-100 overflow-hidden text-xs font-mono">
                                                    {log.oldValue && (
                                                        <div className="p-2 border-b border-neutral-100 flex gap-4 bg-red-50/30">
                                                            <span className="w-8 text-red-500 font-bold select-none text-right">-</span>
                                                            <div className="text-neutral-600 break-all">
                                                                {JSON.stringify(log.oldValue, null, 2)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {log.newValue && (
                                                        <div className="p-2 flex gap-4 bg-green-50/30">
                                                            <span className="w-8 text-green-500 font-bold select-none text-right">+</span>
                                                            <div className="text-neutral-600 break-all">
                                                                {JSON.stringify(log.newValue, null, 2)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {log.ipAddress && (
                                                <div className="mt-3 flex items-center justify-end">
                                                    <span className="text-[10px] text-neutral-300 font-mono" title="Logged IP Address">
                                                        IP: {log.ipAddress}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
