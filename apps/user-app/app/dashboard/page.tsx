'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Badge, Skeleton, Button } from '@repo/ui';
import { useAuth, usePermission } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import {
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    ArrowRight,
    TrendingUp,
    FileSignature,
    Sparkles,
    Calendar,
    ArrowUpRight,
    Zap,
    Briefcase
} from 'lucide-react';

interface DashboardStats {
    totalContracts: number;
    activeContracts: number;
    draftContracts: number;
    pendingApprovals: number;
}

interface RecentContract {
    id: string;
    title: string;
    contractCode: string;
    status: string;
    createdAt: string;
    amount?: number;
    counterpartyName?: string;
}

interface PendingApproval {
    id: string;
    contractTitle: string;
    submittedBy: string;
    submittedAt: string;
    approvalType: 'LEGAL' | 'FINANCE';
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, currentOrg, permissions } = useAuth();

    // Permissions
    const canViewContracts = usePermission('contract:view');
    const canCreateContract = usePermission('contract:create');
    const canViewLegalApprovals = usePermission('approval:legal:view');
    const canViewFinanceApprovals = usePermission('approval:finance:view');

    // State
    const [stats, setStats] = useState<DashboardStats>({
        totalContracts: 0,
        activeContracts: 0,
        draftContracts: 0,
        pendingApprovals: 0
    });
    const [recentContracts, setRecentContracts] = useState<RecentContract[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const timeOfDay = (() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    })();

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!currentOrg) return;

            setIsLoading(true);
            try {
                const promises = [];

                // Fetch contract summary
                if (canViewContracts) {
                    promises.push(
                        api.analytics.contractsSummary().catch(() => ({ total: 0, byStatus: {} }))
                    );
                    promises.push(
                        api.contracts.list({ limit: 5 }).catch(() => ({ contracts: [], total: 0 }))
                    );
                } else {
                    promises.push(Promise.resolve({ total: 0, byStatus: {} }));
                    promises.push(Promise.resolve({ contracts: [], total: 0 }));
                }

                // Fetch approvals if user has permission
                if (canViewLegalApprovals) {
                    promises.push(
                        api.approvals.pending('LEGAL').catch(() => [])
                    );
                } else if (canViewFinanceApprovals) {
                    promises.push(
                        api.approvals.pending('FINANCE').catch(() => [])
                    );
                } else {
                    promises.push(Promise.resolve([]));
                }

                const [summaryData, contractsData, approvalsData] = await Promise.all(promises);

                // Process stats
                const summary = summaryData as any;
                setStats({
                    totalContracts: summary.total || 0,
                    activeContracts: summary.active || 0,
                    draftContracts: summary.draft || 0,
                    pendingApprovals: Array.isArray(approvalsData) ? approvalsData.length : 0,
                });

                // Process recent contracts
                const contracts = (contractsData as any).contracts || [];
                setRecentContracts(contracts.slice(0, 5));

                // Process pending approvals
                const approvals = Array.isArray(approvalsData) ? approvalsData : [];
                setPendingApprovals(approvals.slice(0, 5).map((approval: any) => ({
                    id: approval.id,
                    contractTitle: approval.contract?.title || 'Unknown Contract',
                    submittedBy: approval.contract?.createdByUser?.name || 'Unknown',
                    submittedAt: approval.createdAt,
                    approvalType: approval.type,
                })));

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [currentOrg, canViewContracts, canViewLegalApprovals, canViewFinanceApprovals]);

    const getStatusColor = (status: string) => {
        const statusMap: Record<string, string> = {
            DRAFT: 'bg-slate-50 text-slate-500 border-slate-200',
            PENDING_LEGAL: 'bg-amber-50 text-amber-600 border-amber-100',
            PENDING_FINANCE: 'bg-amber-50 text-amber-600 border-amber-100',
            ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            SIGNED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            REJECTED: 'bg-rose-50 text-rose-600 border-rose-100',
            CANCELLED: 'bg-rose-50 text-rose-600 border-rose-100',
        };
        return statusMap[status] || 'bg-slate-50 text-slate-500 border-slate-100';
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    if (!user || !currentOrg) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Skeleton className="w-full h-32" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 selection:bg-orange-100 relative max-w-[1600px] mx-auto px-6 py-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentDate}</p>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
                        {timeOfDay}, {user.name.split(' ')[0]}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Here is your operational snapshot for <span className="text-slate-900 font-bold">{currentOrg.name}</span>.</p>
                </div>

                {canCreateContract && (
                    <Button
                        onClick={() => router.push('/dashboard/contracts/new')}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 h-10 shadow-lg shadow-orange-600/20 border-none transition-all font-bold tracking-tight uppercase text-[10px] flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Contract
                    </Button>
                )}
            </div>

            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {canViewContracts && (
                    <>
                        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 hover:border-slate-200 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</div>
                                <div className="p-1.5 bg-blue-50 rounded-lg">
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalContracts}</h3>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>+12%</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 hover:border-slate-200 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active & Live</div>
                                <div className="p-1.5 bg-emerald-50 rounded-lg">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stats.activeContracts}</h3>
                                <span className="text-[10px] font-bold text-slate-400">Contracts running</span>
                            </div>
                        </Card>

                        <Card className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 hover:border-slate-200 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Drafts</div>
                                <div className="p-1.5 bg-amber-50 rounded-lg">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stats.draftContracts}</h3>
                                <span className="text-[10px] font-bold text-slate-400">Work in progress</span>
                            </div>
                        </Card>
                    </>
                )}

                {(canViewLegalApprovals || canViewFinanceApprovals) && (
                    <Card className="bg-slate-900 border border-slate-800 shadow-sm rounded-xl p-4 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none group-hover:bg-orange-500/20 transition-colors" />
                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <div className="text-[10px] font-bold text-orange-200/60 uppercase tracking-wider">Approvals</div>
                            <div className="p-1.5 bg-white/10 rounded-lg">
                                <Zap className="w-3.5 h-3.5 text-orange-400" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <h3 className="text-2xl font-bold text-white tracking-tight">{stats.pendingApprovals}</h3>
                            <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">Action Required</span>
                        </div>
                    </Card>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                            Recent Contracts
                        </h2>
                        {canViewContracts && (
                            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/contracts')} className="text-slate-500 hover:text-slate-900 font-bold text-xs flex items-center gap-1 group transition-colors">
                                View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        )}
                    </div>

                    <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[40%]">Contract</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[20%]">Status</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[30%]">Counterparty</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[10%]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading ? (
                                        [1, 2, 3].map(i => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : recentContracts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                                                <div className="p-4 bg-slate-50 rounded-full">
                                                    <Briefcase className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <p className="text-slate-400 font-medium text-xs">No recent activity detected.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        recentContracts.map((contract) => (
                                            <tr
                                                key={contract.id}
                                                className="hover:bg-slate-50/50 transition-all group cursor-pointer"
                                                onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors text-sm tracking-tight mb-0.5">{contract.title}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 font-mono tracking-wide">{contract.contractCode}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wide shadow-sm border ${getStatusColor(contract.status)}`}>
                                                        {formatStatus(contract.status)}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                                    {contract.counterpartyName || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 ml-auto group-hover:bg-white group-hover:text-orange-600 group-hover:shadow-sm border border-transparent group-hover:border-slate-100 transition-all">
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions Card */}
                    <Card className="bg-slate-900 text-white border-transparent shadow-sm rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/20 rounded-full blur-[60px] group-hover:bg-orange-600/30 transition-colors duration-1000" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <Sparkles className="w-4 h-4 text-orange-400" />
                                <h3 className="text-sm font-bold tracking-wide uppercase">Quick Actions</h3>
                            </div>

                            <div className="space-y-3">
                                {canCreateContract && (
                                    <button
                                        onClick={() => router.push('/dashboard/contracts/new')}
                                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group/btn"
                                    >
                                        <span className="text-xs font-bold tracking-wide">Start New Contract</span>
                                        <div className="p-1.5 bg-orange-600 rounded-lg group-hover/btn:scale-105 transition-transform">
                                            <Plus className="w-3 h-3 text-white" />
                                        </div>
                                    </button>
                                )}
                                {canViewContracts && (
                                    <button
                                        onClick={() => router.push('/dashboard/templates')}
                                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group/btn"
                                    >
                                        <span className="text-xs font-bold tracking-wide">Browse Templates</span>
                                        <div className="p-1.5 bg-white/10 rounded-lg group-hover/btn:bg-white/20 transition-colors">
                                            <FileSignature className="w-3 h-3 text-white" />
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Pending Approvals List */}
                    {(canViewLegalApprovals || canViewFinanceApprovals) && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Approval Queue
                                </h3>
                            </div>

                            {isLoading ? (
                                <Skeleton className="h-20 w-full rounded-2xl" />
                            ) : pendingApprovals.length === 0 ? (
                                <Card className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
                                    <CardContent className="p-6 text-center">
                                        <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All caught up</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {pendingApprovals.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => router.push(canViewLegalApprovals ? '/dashboard/approvals/legal' : '/dashboard/approvals/finance')}
                                            className="p-4 rounded-xl border border-slate-100 bg-white hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer group relative overflow-hidden"
                                        >
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Badge className="bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                        {item.approvalType}
                                                    </Badge>
                                                    <span className="text-[9px] font-medium text-slate-400">
                                                        {new Date(item.submittedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-slate-900 text-sm mb-1 group-hover:text-orange-600 transition-colors line-clamp-1">
                                                    {item.contractTitle}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">
                                                    From <span className="text-slate-700 font-bold">{item.submittedBy}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
