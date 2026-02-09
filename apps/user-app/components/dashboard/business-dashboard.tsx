'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useDashboardData } from '@/lib/hooks/use-dashboard';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Skeleton } from '@repo/ui';
import { cn } from '@repo/ui';
import type { Contract } from '@repo/types';

function formatINR(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount).replace('₹', '₹ ');
}

function formatDate(dateValue: string | Date): string {
    return new Date(dateValue).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function getStatusBadgeClasses(status: string): string {
    switch (status.toUpperCase()) {
        case 'ACTIVE':
            return 'bg-emerald-100 text-emerald-800';
        case 'DRAFT':
            return 'bg-neutral-100 text-neutral-700';
        case 'PENDING_LEGAL':
        case 'PENDING_FINANCE':
        case 'UNDER_REVIEW':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-neutral-100 text-neutral-600';
    }
}

function getStatusLabel(status: string): string {
    switch (status.toUpperCase()) {
        case 'ACTIVE':
            return 'Active';
        case 'DRAFT':
            return 'Draft';
        case 'PENDING_LEGAL':
            return 'Pending Review';
        case 'PENDING_FINANCE':
            return 'Pending Review';
        case 'UNDER_REVIEW':
            return 'Pending Review';
        default:
            return status;
    }
}

export function BusinessDashboard() {
    const { user, currentOrg } = useAuth();
    const { data, isLoading } = useDashboardData(currentOrg?.id);

    type ContractSummary = Contract & { value?: number };

    const firstName = user?.name?.split(' ')[0] || 'User';

    // Stats from API data
    const myContractsCount = data?.stats?.totalContracts || 0;
    const activeCount = data?.stats?.activeContracts || 0;
    const draftCount = data?.stats?.draftContracts || 0;
    const pendingCount = data?.stats?.pendingApprovals || 0;

    // Recent contracts
    const recentContracts = (data?.recentContracts ?? []) as ContractSummary[];

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-neutral-900">
                    Good Morning, {firstName}
                </h1>
                <p className="text-neutral-500 mt-1">
                    Here is the status of your contract portfolio today.
                </p>
            </div>

            {/* Stats Grid - 4 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* My Contracts */}
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-2 text-neutral-500 mb-3">
                        <MaterialIcon name="folder_shared" size={20} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            My Contracts
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">
                        {isLoading ? '...' : myContractsCount}
                    </div>
                </div>

                {/* Active */}
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-emerald-200 transition-colors">
                    <div className="flex items-center gap-2 text-emerald-600 mb-3">
                        <MaterialIcon name="check_circle" size={20} className="icon-fill" />
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                            Active
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">
                        {isLoading ? '...' : activeCount}
                    </div>
                </div>

                {/* Drafts */}
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-neutral-300 transition-colors">
                    <div className="flex items-center gap-2 text-neutral-500 mb-3">
                        <MaterialIcon name="edit_document" size={20} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            Drafts
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">
                        {isLoading ? '...' : draftCount}
                    </div>
                </div>

                {/* Pending Review */}
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-2 text-blue-600 mb-3">
                        <MaterialIcon name="rate_review" size={20} />
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                            Pending Review
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">
                        {isLoading ? '...' : pendingCount}
                    </div>
                </div>
            </div>

            {/* Quick Actions + Recent Contracts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Quick Actions */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-neutral-900">Quick Actions</h2>

                    {/* Create from Template */}
                    <Link href="/dashboard/contracts/create">
                        <button className="group w-full flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                                <MaterialIcon name="add_box" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-neutral-900 group-hover:text-indigo-700 transition-colors">
                                    Create from Template
                                </h3>
                                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                                    Use approved {currentOrg?.name || 'organization'} templates.
                                </p>
                            </div>
                        </button>
                    </Link>

                    {/* Upload Agreement */}
                    <Link href="/dashboard/contracts/upload">
                        <button className="group w-full flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                                <MaterialIcon name="upload_file" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-neutral-900 group-hover:text-indigo-700 transition-colors">
                                    Upload Agreement
                                </h3>
                                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                                    Import counterparty paper (PDF).
                                </p>
                            </div>
                        </button>
                    </Link>
                </div>

                {/* Right 2 Columns: Recent Contracts Table */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-neutral-900">My Recent Contracts</h2>
                        <Link
                            href="/dashboard/contracts"
                            className="text-sm font-medium text-indigo-700 hover:text-indigo-800 hover:underline"
                        >
                            View All
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        {isLoading ? (
                            <div className="p-6 space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-12 w-full rounded" />
                                ))}
                            </div>
                        ) : recentContracts.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MaterialIcon name="description" size={32} />
                                </div>
                                <h3 className="text-neutral-900 font-medium">No contracts yet</h3>
                                <p className="text-sm text-neutral-500 mt-1">
                                    Create a contract to get started.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm text-neutral-600">
                                <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-100">
                                    <tr>
                                        <th className="px-6 py-4">Contract Name</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 font-mono">Amount (INR)</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {recentContracts.slice(0, 5).map((contract) => {
                                        const contractValue = contract.amount ?? contract.value;
                                        return (
                                        <tr
                                            key={contract.id}
                                            className="hover:bg-neutral-50 transition-colors group"
                                        >
                                            <td className="px-6 py-4 font-medium text-neutral-900">
                                                {contract.title || 'Untitled Contract'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                                        getStatusBadgeClasses(contract.status)
                                                    )}
                                                >
                                                    {getStatusLabel(contract.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-neutral-700">
                                                {contractValue
                                                    ? formatINR(contractValue)
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">
                                                {contract.createdAt
                                                    ? formatDate(contract.createdAt)
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/dashboard/contracts/${contract.id}`}>
                                                    <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                                        <MaterialIcon name="more_vert" size={20} />
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
