'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, Skeleton } from '@repo/ui';
import { useAuth, usePermission } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { StageFilter } from '@/components/stage-filter';
import { Pagination } from '@/components/ui/pagination';
import { FileText, Search, Filter, Plus, FileSignature, Calendar, ArrowUpRight, Briefcase, Eye, LayoutGrid, List } from 'lucide-react';
import { ContractCard } from '@/components/contract-card';

const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-50 text-slate-500 border-slate-200',
    SENT_TO_LEGAL: 'bg-amber-50 text-amber-600 border-amber-100',
    SENT_TO_FINANCE: 'bg-amber-50 text-amber-600 border-amber-100',
    LEGAL_APPROVED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    FINANCE_REVIEWED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
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
    counterpartyBusinessName?: string | null;
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
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const isFirstRun = useRef(true);

    // Debounce search
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        const timer = setTimeout(() => {
            if (page === 1) {
                fetchContracts();
            } else {
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        fetchContracts();
    }, [page, isAuthenticated, currentOrg]);

    const fetchContracts = async () => {
        if (!isAuthenticated || !currentOrg) return;

        setIsLoading(true);
        try {
            const response = await api.contracts.list({
                status: statusFilter || undefined,
                page,
                limit: viewMode === 'grid' ? 12 : 10, // Adjust page size for grid
                search: searchQuery
            });
            // @ts-ignore
            if (response.data) {
                // @ts-ignore
                setContracts(response.data as Contract[]);
                // @ts-ignore
                setMeta(response.meta);
            } else {
                setContracts(response as unknown as Contract[]);
            }
        } catch (error) {
            console.error('Failed to fetch contracts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateContract = () => {
        router.push('/dashboard/contracts/new');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contracts</h1>
                    <p className="text-slate-500">Manage and track your contracts.</p>
                </div>
                {canCreate && (
                    <Button
                        onClick={() => router.push('/dashboard/contracts/new')}
                        variant="default"
                        size="lg"
                        className="w-full md:w-auto"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                        <span>Create New Contract</span>
                    </Button>
                )}
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search contracts..."
                            className="pl-9 w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:flex-none">
                            <StageFilter
                                value={statusFilter}
                                onChange={setStatusFilter}
                            />
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 shrink-0 shadow-inner">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            ) : contracts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <div className="mx-auto h-12 w-12 text-slate-400 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No contracts found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-1">
                        Get started by creating a new contract from a template.
                    </p>
                    {canCreate && (
                        <Button onClick={handleCreateContract} variant="outline" className="mt-4">
                            Create Contract
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <>
                            {/* Desktop Table View - Hidden on Mobile */}
                            <div className="hidden md:block bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Reference</th>
                                                <th className="px-6 py-3 font-medium">Title</th>
                                                <th className="px-6 py-3 font-medium">Counterparty</th>
                                                <th className="px-6 py-3 font-medium">Status</th>
                                                <th className="px-6 py-3 font-medium">Created</th>
                                                <th className="px-6 py-3 font-medium text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {contracts.map((contract) => (
                                                <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                        {contract.reference}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-900">
                                                        {contract.title}
                                                        <div className="text-xs text-slate-400 font-normal mt-0.5">
                                                            {contract.template?.category || 'General'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        {contract.counterpartyBusinessName ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-800">{contract.counterpartyBusinessName}</span>
                                                                <span className="text-xs text-slate-400">{contract.counterpartyName || '-'}</span>
                                                            </div>
                                                        ) : (
                                                            contract.counterpartyName || '-'
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={statusColors[contract.status] || 'bg-slate-100 text-slate-700'}>
                                                            {contract.status.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">
                                                        {new Date(contract.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Eye className="w-4 h-4 text-slate-400" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Card View - Shown only on Mobile */}
                            <div className="md:hidden space-y-4">
                                {contracts.map((contract) => (
                                    <div
                                        key={contract.id}
                                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                                                    {contract.reference}
                                                </span>
                                                <h3 className="font-bold text-slate-900 leading-tight">
                                                    {contract.title}
                                                </h3>
                                            </div>
                                            <Badge className={`${statusColors[contract.status] || 'bg-slate-100 text-slate-700'} text-[10px] px-2 py-0.5`}>
                                                {contract.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5 tracking-tight">Counterparty</p>
                                                <p className="text-slate-700 font-medium truncate">
                                                    {contract.counterpartyBusinessName || contract.counterpartyName || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5 tracking-tight">Created On</p>
                                                <p className="text-slate-700 font-medium">
                                                    {new Date(contract.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <Button variant="outline" className="w-full gap-2 text-xs font-bold border-slate-200 text-slate-600 h-9">
                                            <Eye size={14} />
                                            View Contract Details
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {contracts.map((contract) => (
                                <ContractCard
                                    key={contract.id}
                                    contract={contract}
                                    statusColors={statusColors}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {meta && (
                        <div className="mt-6 flex justify-center">
                            <Pagination
                                meta={meta}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
