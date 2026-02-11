'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    Badge,
    Skeleton,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@repo/ui';
import { useAuth, usePermission } from '@/lib/auth-context';
import { useDashboardData } from '@/lib/hooks/use-dashboard';
import { AttentionBanner } from '@/components/dashboard/attention-banner';
import { RecentContractsTable } from '@/components/dashboard/recent-contracts-table';
import { StatCard } from '@/components/dashboard/stat-card';
import {
    FileText,
    Clock,
    AlertCircle,
    Plus,
    ArrowRight,
    TrendingUp,
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    Download,
    MessageSquare,
    Sparkles,
    Briefcase,
    Mail
} from 'lucide-react';

interface RecentContract {
    id: string;
    title: string;
    contractCode: string;
    status: string;
    createdAt: string;
    amount?: number;
    counterpartyName?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, currentOrg } = useAuth();
    const [isOracleOpen, setIsOracleOpen] = useState(false);

    // Permissions
    const canViewContracts = usePermission('contract:view');
    const canCreateContract = usePermission('contract:create');
    const canEditContract = usePermission('contract:edit');
    const canDeleteContract = usePermission('contract:delete');
    const canViewLegalApprovals = usePermission('approval:legal:view');
    const canViewFinanceApprovals = usePermission('approval:finance:view');

    // State management via React Query
    const { data: dashboardData, isLoading } = useDashboardData(currentOrg?.id);

    const stats = dashboardData?.stats || {
        totalContracts: 0,
        activeContracts: 0,
        activeValue: 0,
        draftContracts: 0,
        pendingApprovals: 0,
        trend: undefined
    };

    const recentContracts = (dashboardData?.recentContracts || []) as RecentContract[];
    const pendingApprovals = (dashboardData?.pendingApprovals || []).map((approval: any) => ({
        id: approval.id,
        contractId: approval.contract?.id,
        contractTitle: approval.contract?.title || 'Unknown Contract',
        submittedBy: approval.contract?.createdByUser?.name || 'Unknown',
        submittedAt: approval.createdAt,
        approvalType: approval.type,
    }));

    // Time & Date
    const timeOfDay = (() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    })();

    const getStatusStyles = (status: string) => {
        const statusMap: Record<string, string> = {
            DRAFT: 'bg-slate-100 text-slate-600',
            SENT_TO_LEGAL: 'bg-amber-50 text-amber-700 border-amber-200',
            SENT_TO_FINANCE: 'bg-amber-50 text-amber-700 border-amber-200',
            ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            SIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
            REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
            CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
        };
        return statusMap[status] || 'bg-slate-50 text-slate-500';
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(1)}Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        } else if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}k`;
        }
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    if (!user || !currentOrg) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Skeleton className="w-full h-32" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-24 selection:bg-orange-100 relative">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>

                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-2">
                        {timeOfDay}, {user.name.split(' ')[0]}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Here is your operational snapshot for <span className="text-slate-900 font-bold">{currentOrg.name}</span>.</p>
                </div>

                {canCreateContract && (
                    <Button
                        onClick={() => router.push('/dashboard/contracts/new')}
                        className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-6 h-11 shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] hover:shadow-orange-600/40 font-bold tracking-tight text-sm group relative overflow-hidden flex items-center gap-2"
                        size="lg"
                    >
                        <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                        Create New Contract
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </Button>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Contract"
                    value={stats.totalContracts}
                    icon={FileText}
                    trend={stats.trend}
                    variant="blue"
                    delay={100}
                />
                <StatCard
                    title="Active Value"
                    value={formatCurrency(stats.activeValue || 0)}
                    icon={Briefcase}
                    description="Total active contract value"
                    variant="emerald"
                    delay={200}
                />
                <StatCard
                    title="Pending Contract"
                    value={stats.draftContracts}
                    icon={Clock}
                    description="Work in progress"
                    variant="orange"
                    delay={300}
                />
            </div>

            {/* Attention Banner */}
            <AttentionBanner
                expiringContracts={dashboardData?.expiringContracts}
                rejectedContracts={dashboardData?.rejectedContracts}
                pendingApprovals={pendingApprovals}
                canViewLegalApprovals={canViewLegalApprovals}
            />

            {/* Recent Contracts Table */}
            <RecentContractsTable
                contracts={recentContracts}
                isLoading={isLoading}
                canViewContracts={canViewContracts}
                canEditContract={canEditContract}
                canDeleteContract={canDeleteContract}
            />

            {/* Oracle AI FAB */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
                {isOracleOpen && (
                    <div className="w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 mb-2">
                        <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-orange-400" />
                                <span className="font-bold text-sm">Lumina Oracle</span>
                            </div>
                            <button onClick={() => setIsOracleOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <Sparkles size={14} className="text-slate-600" />
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl rounded-tl-none text-xs text-slate-600 leading-relaxed">
                                    Hello! I am Oracle, your contract intelligence assistant. Ask me about your expiring contracts, total liability, or template usage.
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ask Oracle..."
                                    className="w-full bg-white border border-slate-200 rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                                />
                                <button className="absolute right-1.5 top-1.5 p-1 bg-slate-100 rounded-full text-slate-400 hover:bg-orange-600 hover:text-white transition-colors">
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setIsOracleOpen(!isOracleOpen)}
                    className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                >
                    {isOracleOpen ? <MessageSquare size={24} /> : <Sparkles size={24} />}
                </button>
            </div>

        </div >
    );
}
