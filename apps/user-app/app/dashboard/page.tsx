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
        pendingApprovals: 0
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
            PENDING_LEGAL: 'bg-amber-50 text-amber-700 border-amber-200',
            PENDING_FINANCE: 'bg-amber-50 text-amber-700 border-amber-200',
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
                <Card className="bg-white border-0 shadow-sm rounded-2xl p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
                            <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{stats.totalContracts}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText size={20} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                            <TrendingUp size={12} className="mr-1" />
                            +12%
                        </div>
                        <span className="text-slate-400 text-xs">from last month</span>
                    </div>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-2xl p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Value</p>
                            <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{formatCurrency(stats.activeValue || 0)}</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Briefcase size={20} />
                        </div>
                    </div>
                    <span className="text-slate-400 text-xs">Total active contract value</span>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-2xl p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Drafts</p>
                            <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{stats.draftContracts}</h3>
                        </div>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                    </div>
                    <span className="text-slate-400 text-xs">Work in progress</span>
                </Card>
            </div>

            {/* Attention Needed Banner */}
            {(stats.pendingApprovals > 0 || (dashboardData?.expiringContracts?.length || 0) > 0) && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-1">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                            <AlertCircle size={16} />
                            Attention Needed
                        </div>
                        <Badge variant="outline" className="bg-white text-rose-700 border-rose-200">
                            Expiring in ≤ 30 days
                        </Badge>
                    </div>
                    <div className="bg-white rounded-xl divide-y divide-slate-50 border border-rose-100/50 shadow-sm">
                        {dashboardData?.expiringContracts?.map((contract: any) => (
                            <div key={contract.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">{contract.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{contract.counterpartyName || 'External Vendor'}</span>
                                            <span className="text-rose-600 font-medium">• Expires {new Date(contract.endDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" className="bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                                    Review Contract
                                </Button>
                            </div>
                        ))}
                        {pendingApprovals.map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => router.push(canViewLegalApprovals ? '/dashboard/approvals/legal' : '/dashboard/approvals/finance')}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">{item.contractTitle}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>Pending {item.approvalType} Approval</span>
                                            <span className="text-slate-400">• Submitted by {item.submittedBy}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" className="bg-white text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700">
                                    Review Request
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Contracts Table */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Recent Contracts</h2>
                    {canViewContracts && (
                        <Button variant="ghost" onClick={() => router.push('/dashboard/contracts')} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold text-sm">
                            View All <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>

                <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-visible">
                    <div className="overflow-x-auto rounded-2xl">
                        <table className="w-full">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-[40%]">Contract</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-[15%]">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-[25%]">Date</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest w-[10%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : recentContracts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center">
                                            <div className="inline-flex p-4 bg-slate-50 rounded-full mb-3">
                                                <Briefcase className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No recent contracts found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    recentContracts.map((contract) => (
                                        <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm mb-0.5 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}>{contract.title}</div>
                                                        <div className="text-sm text-slate-500">{contract.counterpartyName || 'External Vendor'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <Badge variant="outline" className={`border-none px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wide ${getStatusStyles(contract.status)}`}>
                                                    {formatStatus(contract.status)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-medium text-slate-500">
                                                {new Date(contract.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
                                                            <MoreHorizontal size={18} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 p-1.5 bg-white rounded-xl border border-slate-100 shadow-xl z-[100]">
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/contracts/${contract.id}`)} className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer outline-none">
                                                            <Eye className="w-4 h-4 mr-3 text-slate-400" />
                                                            Review
                                                        </DropdownMenuItem>
                                                        {canEditContract && (
                                                            <DropdownMenuItem onClick={() => router.push(`/dashboard/contracts/${contract.id}/edit`)} className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer outline-none">
                                                                <Edit2 className="w-4 h-4 mr-3 text-slate-400" />
                                                                Edit Terms
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer outline-none">
                                                            <Mail className="w-4 h-4 mr-3 text-slate-400" />
                                                            Send by Email
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer outline-none">
                                                            <Download className="w-4 h-4 mr-3 text-slate-400" />
                                                            Download PDF
                                                        </DropdownMenuItem>
                                                        {canDeleteContract && (
                                                            <>
                                                                <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                                                <DropdownMenuItem className="flex items-center px-3 py-2 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer outline-none">
                                                                    <Trash2 className="w-4 h-4 mr-3" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

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

        </div>
    );
}
