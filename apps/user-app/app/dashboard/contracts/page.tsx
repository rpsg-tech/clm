'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, Skeleton } from '@repo/ui';
import { useAuth, usePermission } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { StageFilter } from '@/components/stage-filter';
import { FileText, Search, Filter, Plus, FileSignature, Calendar, ArrowUpRight, Briefcase, Eye } from 'lucide-react';

const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-50 text-slate-500 border-slate-200',
    PENDING_LEGAL: 'bg-amber-50 text-amber-600 border-amber-100',
    PENDING_FINANCE: 'bg-amber-50 text-amber-600 border-amber-100',
    LEGAL_APPROVED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    FINANCE_APPROVED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    SENT_TO_COUNTERPARTY: 'bg-blue-50 text-blue-600 border-blue-100',
    COUNTERSIGNED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    EXPIRED: 'bg-rose-50 text-rose-600 border-rose-100',
    TERMINATED: 'bg-rose-50 text-rose-600 border-rose-100',
    REJECTED: 'bg-rose-50 text-rose-600 border-rose-100',
    CANCELLED: 'bg-rose-50 text-rose-600 border-rose-100',
};

interface Contract {
    id: string;
    reference: string;
    title: string;
    status: string;
    counterpartyName: string | null;
    createdAt: string;
    startDate?: string;
    endDate?: string;
    amount?: number;
    template: { name: string; category: string };
    createdByUser: { name: string; email: string };
}

export default function ContractsListPage() {
    const router = useRouter();
    const { isAuthenticated, currentOrg } = useAuth();
    const canCreate = usePermission('contract:create');

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        const fetchContracts = async () => {
            if (!isAuthenticated || !currentOrg) return;

            setIsLoading(true);
            try {
                const response = await api.contracts.list({ status: statusFilter || undefined });
                setContracts(response.contracts as Contract[]);
            } catch (error) {
                console.error('Failed to fetch contracts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContracts();
    }, [statusFilter, isAuthenticated, currentOrg]);

    const filteredContracts = contracts.filter(
        (c) =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.counterpartyName?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const getStageLabel = (status: string) => {
        const map: Record<string, string> = {
            'DRAFT': 'Draft',
            'PENDING_LEGAL': 'Legal Review',
            'PENDING_FINANCE': 'Finance Review',
            'LEGAL_APPROVED': 'Legal Approved',
            'FINANCE_APPROVED': 'Finance Approved',
            'APPROVED': 'Ready for Sign',
            'SENT_TO_COUNTERPARTY': 'Sent',
            'COUNTERSIGNED': 'Countersigned',
            'ACTIVE': 'Active',
            'REJECTED': 'Rejected',
            'TERMINATED': 'Terminated',
            'EXPIRED': 'Expired',
            'CANCELLED': 'Cancelled'
        };
        return map[status] || status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };

    const getStageColor = (status: string) => {
        return statusColors[status] || 'bg-slate-50 text-slate-500 border-slate-100';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 selection:bg-orange-100 relative">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Contracts</h1>
                    <p className="text-slate-500 font-medium text-sm">Manage and track your <span className="text-slate-900">commercial agreements</span>.</p>
                </div>
                {canCreate && (
                    <Button
                        onClick={() => router.push('/dashboard/contracts/new')}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 h-10 shadow-lg shadow-orange-600/20 border-none transition-all font-bold tracking-tight text-xs flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Contract
                    </Button>
                )}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by title, reference, or counterparty..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-transparent border-none text-sm font-medium placeholder:text-slate-400 focus:outline-none text-slate-900"
                    />
                </div>
                <div className="h-6 w-px bg-slate-200 hidden md:block" />
                <div className="flex items-center gap-3 w-full md:w-auto px-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <div className="min-w-[200px]">
                        <StageFilter
                            value={statusFilter}
                            onChange={setStatusFilter}
                        />
                    </div>
                </div>
            </div>

            {/* Contracts Table */}
            <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-6 p-4 border border-slate-50 rounded-xl bg-slate-50/50 animate-pulse">
                                <div className="h-10 w-10 rounded-lg bg-slate-100" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-slate-100 rounded-full w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredContracts.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="p-6 bg-slate-50 rounded-full border border-slate-100 mb-6 animate-in zoom-in-95 duration-500">
                            {searchQuery || statusFilter ? (
                                <Search className="w-8 h-8 text-slate-300" />
                            ) : (
                                <FileSignature className="w-8 h-8 text-slate-300" />
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
                            {searchQuery || statusFilter ? 'No Matches Found' : 'No Contracts Yet'}
                        </h3>
                        <p className="text-slate-400 font-medium text-xs max-w-sm text-center leading-relaxed">
                            {searchQuery || statusFilter
                                ? 'Adjust your filters to find what you need.'
                                : 'Start by drafting your first commercial agreement.'}
                        </p>
                        {(searchQuery || statusFilter) && (
                            <Button
                                variant="ghost"
                                onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
                                className="mt-6 text-orange-600 hover:bg-orange-50 font-bold uppercase text-[10px] tracking-widest"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[35%]">Contract</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[20%]">Counterparty</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[15%]">Timeline</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[10%]">Value</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[10%]">Stage</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[10%]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredContracts.map((contract) => (
                                    <tr
                                        key={contract.id}
                                        className="hover:bg-slate-50/50 transition-all cursor-default group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 transition-all shadow-sm">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors text-sm tracking-tight mb-0.5">{contract.title}</div>
                                                    <div className="text-[10px] font-medium text-slate-400 font-mono tracking-wide">{contract.reference || contract.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {contract.counterpartyName ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500">
                                                        {contract.counterpartyName.charAt(0)}
                                                    </div>
                                                    <span className="text-xs text-slate-600 font-bold group-hover:text-slate-900">
                                                        {contract.counterpartyName}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-medium italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                {contract.startDate ? (
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                                                        <span>{new Date(contract.startDate).toLocaleDateString('en-GB')}</span>
                                                    </div>
                                                ) : <span className="text-[10px] text-slate-300">-</span>}

                                                {contract.endDate && (
                                                    <span className="text-[9px] font-medium text-slate-400">
                                                        to {new Date(contract.endDate).toLocaleDateString('en-GB')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {contract.amount ? (
                                                <span className="text-xs font-mono font-bold text-slate-700">
                                                    ₹{contract.amount.toLocaleString('en-IN')}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wide border shadow-sm ${getStageColor(contract.status)}`}>
                                                {getStageLabel(contract.status)}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/contracts/${contract.id}`);
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card >
        </div >
    );
}
