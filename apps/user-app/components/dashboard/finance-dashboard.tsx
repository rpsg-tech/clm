'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useDashboardData } from '@/lib/hooks/use-dashboard';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Skeleton } from '@repo/ui';
import { cn } from '@repo/ui';
import type { Approval, Contract } from '@repo/types';

function formatINR(amount: number): string {
    // Format for crores and lakhs
    if (amount >= 10000000) {
        return `₹ ${(amount / 10000000).toFixed(1)} Cr`;
    }
    if (amount >= 100000) {
        return `₹ ${(amount / 100000).toFixed(1)} L`;
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount).replace('₹', '₹ ');
}

function getDaysPending(createdAt: string | Date): number {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function FinanceDashboard() {
    const { currentOrg } = useAuth();
    const { data, isLoading } = useDashboardData(currentOrg?.id);

    type ApprovalSummary = Approval & {
        stage?: string;
        title?: string;
        counterpartyName?: string;
        value?: number;
        requestedBy?: string;
        contract?: Partial<Contract> & { value?: number };
    };

    const pendingApprovals = ((data?.pendingApprovals ?? []) as ApprovalSummary[]).filter(
        (approval) => approval.stage === 'FINANCE' || approval.type === 'FINANCE'
    );

    // Mock data for demo - in production these would come from API
    const recentlyApproved = [
        {
            id: '1',
            title: 'Office Renovation Phase 1',
            party: 'ConstructCo Ltd.',
            amount: 4500000,
            condition: 'Milestone Based',
            conditionColor: 'blue',
            remarks: 'Subject to final legal review.',
        },
        {
            id: '2',
            title: 'IT Hardware Refresh',
            party: 'TechSystems India',
            amount: 8250000,
            condition: 'Standard Terms',
            conditionColor: 'green',
            remarks: 'Budget approved in Q1 planning.',
        },
        {
            id: '3',
            title: 'Annual Audit Services',
            party: 'Global FinAuditors',
            amount: 1500000,
            condition: 'Recurring',
            conditionColor: 'purple',
            remarks: 'Renewal approved for FY 25-26.',
        },
    ];

    const allAgreements = [
        {
            id: '1',
            title: 'Security Services Master Agreement',
            party: 'SecureGuard Solutions',
            value: 3600000,
            status: 'Active',
            statusColor: 'green',
            endDate: 'Mar 2026',
        },
        {
            id: '2',
            title: 'Employee Health Insurance',
            party: 'LifeCare Insure',
            value: 12000000,
            status: 'Active',
            statusColor: 'green',
            endDate: 'Dec 2025',
        },
        {
            id: '3',
            title: 'Facility Management',
            party: 'CleanCo Services',
            value: 1850000,
            status: 'Expiring Soon',
            statusColor: 'amber',
            endDate: 'June 2025',
        },
    ];

    const pendingCount = pendingApprovals.length;
    const approvedThisPeriod = data?.stats?.activeValue || 42000000;
    const totalActiveValue = data?.stats?.activeValue ? data.stats.activeValue * 3 : 125000000;

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Section 1: Pending Finance Approvals - Horizontal Scroll */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                        <MaterialIcon name="warning" size={20} className="text-amber-500" />
                        Pending Finance Approvals
                        <span className="text-xs font-normal text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded-full">
                            Urgent
                        </span>
                    </h3>
                    <Link
                        href="/dashboard/approvals"
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        View All Queue
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="min-w-[320px] h-48 rounded-xl" />
                        ))}
                    </div>
                ) : pendingApprovals.length === 0 ? (
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-12 text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MaterialIcon name="check_circle" size={32} />
                        </div>
                        <h3 className="text-neutral-900 font-medium">All caught up!</h3>
                        <p className="text-sm text-neutral-500 mt-1">
                            No contracts awaiting finance review.
                        </p>
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                        {pendingApprovals.slice(0, 3).map((approval, idx) => {
                            const days = getDaysPending(approval.createdAt);
                            const isUrgent = days >= 3;
                            const icons = ['description', 'local_shipping', 'campaign'];
                            const colors = ['amber', 'blue', 'purple'];
                            const color = colors[idx % 3];
                            const totalValue = approval.value ?? approval.contract?.value;

                            return (
                                <Link
                                    key={approval.id}
                                    href={`/dashboard/contracts/${approval.contractId || approval.id}`}
                                    className="min-w-[320px] bg-white p-5 rounded-xl shadow-sm border border-neutral-200 snap-start hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden"
                                >
                                    <div
                                        className={cn(
                                            'absolute top-0 left-0 w-1 h-full',
                                            isUrgent ? 'bg-amber-500' : 'bg-neutral-300'
                                        )}
                                    />
                                    <div className="flex justify-between items-start mb-3">
                                        <div
                                            className={cn(
                                                'p-2 rounded-lg',
                                                color === 'amber' &&
                                                    'bg-amber-50 text-amber-600',
                                                color === 'blue' && 'bg-blue-50 text-blue-600',
                                                color === 'purple' &&
                                                    'bg-purple-50 text-purple-600'
                                            )}
                                        >
                                            <MaterialIcon
                                                name={icons[idx % 3]}
                                                size={24}
                                            />
                                        </div>
                                        <span
                                            className={cn(
                                                'text-xs font-bold px-2 py-1 rounded',
                                                isUrgent
                                                    ? 'text-amber-600 bg-amber-50'
                                                    : 'text-neutral-500 bg-neutral-100'
                                            )}
                                        >
                                            {days} {days === 1 ? 'Day' : 'Days'} Pending
                                        </span>
                                    </div>
                                    <h4 className="text-base font-bold text-neutral-900 mb-1 group-hover:text-primary transition-colors">
                                        {approval.title || approval.contract?.title || 'Untitled'}
                                    </h4>
                                    <p className="text-sm text-neutral-500 mb-4">
                                        {approval.counterpartyName ||
                                            approval.contract?.counterpartyName ||
                                            'Unknown Party'}
                                    </p>
                                    <div className="flex justify-between items-end border-t border-neutral-100 pt-3 mt-auto">
                                        <div>
                                            <p className="text-xs text-neutral-400">Total Value</p>
                                            <p className="text-lg font-bold text-neutral-900">
                                                {typeof totalValue === 'number'
                                                    ? formatINR(totalValue)
                                                    : '₹ 0'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-neutral-400">Requestor</p>
                                            <p className="text-sm font-medium text-neutral-700">
                                                {approval.requestedBy || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* View All Arrow Button */}
                        <Link
                            href="/dashboard/approvals"
                            className="min-w-[100px] flex items-center justify-center snap-start"
                        >
                            <button className="flex flex-col items-center gap-2 text-neutral-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[32px] bg-white p-3 rounded-full shadow-sm border border-neutral-100">
                                    arrow_forward
                                </span>
                                <span className="text-sm font-medium">View All</span>
                            </button>
                        </Link>
                    </div>
                )}
            </section>

            {/* Section 2: 3 Summary Stats with Circle Icons */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Approvals */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 flex items-center gap-5">
                    <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <MaterialIcon name="hourglass_top" size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-neutral-500">Pending Approvals</p>
                        <h4 className="text-2xl font-bold text-neutral-900">
                            {isLoading ? '...' : pendingCount}
                        </h4>
                    </div>
                </div>

                {/* Approved This Period */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 flex items-center gap-5">
                    <div className="size-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <MaterialIcon name="check_circle" size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-neutral-500">Approved This Period</p>
                        <h4 className="text-2xl font-bold text-neutral-900">
                            {isLoading ? '...' : formatINR(approvedThisPeriod)}
                        </h4>
                    </div>
                </div>

                {/* Total Active Value */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 flex items-center gap-5">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <MaterialIcon name="account_balance_wallet" size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-neutral-500">Total Active Value</p>
                        <h4 className="text-2xl font-bold text-neutral-900">
                            {isLoading ? '...' : formatINR(totalActiveValue)}
                        </h4>
                    </div>
                </div>
            </section>

            {/* Section 3: Recently Approved Table */}
            <section className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-5 border-b border-neutral-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-neutral-900">Recently Approved</h3>
                    <button className="px-3 py-1.5 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
                        Export
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    Contract Name
                                </th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    Amount (₹)
                                </th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    Conditions
                                </th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    Remarks
                                </th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {recentlyApproved.map((item) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-neutral-50 transition-colors"
                                >
                                    <td className="py-4 px-5">
                                        <div className="font-medium text-neutral-900">
                                            {item.title}
                                        </div>
                                        <div className="text-xs text-neutral-500">{item.party}</div>
                                    </td>
                                    <td className="py-4 px-5 font-medium text-neutral-900">
                                        {formatINR(item.amount)}
                                    </td>
                                    <td className="py-4 px-5">
                                        <span
                                            className={cn(
                                                'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                                                item.conditionColor === 'blue' &&
                                                    'bg-blue-50 text-blue-700',
                                                item.conditionColor === 'green' &&
                                                    'bg-green-50 text-green-700',
                                                item.conditionColor === 'purple' &&
                                                    'bg-purple-50 text-purple-700'
                                            )}
                                        >
                                            {item.condition}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5 text-sm text-neutral-600 max-w-xs truncate">
                                        {item.remarks}
                                    </td>
                                    <td className="py-4 px-5 text-right">
                                        <button className="text-neutral-400 hover:text-neutral-600 p-1 rounded">
                                            <MaterialIcon name="more_horiz" size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Section 4: All Organization Agreements Table with Pagination */}
            <section className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-5 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-neutral-900">
                        All Organization Agreements
                    </h3>
                    <button className="p-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-600 flex items-center gap-2 px-3">
                        <MaterialIcon name="filter_list" size={18} />
                        <span className="text-sm font-medium">Filter</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    Title
                                </th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    Party
                                </th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    Value (₹)
                                </th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    Status
                                </th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    End Date
                                </th>
                                <th className="py-3 px-5 text-xs font-semibold uppercase text-neutral-500 tracking-wider text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {allAgreements.map((agreement) => (
                                <tr
                                    key={agreement.id}
                                    className="hover:bg-neutral-50 transition-colors"
                                >
                                    <td className="py-3 px-5 font-medium text-neutral-900 text-sm">
                                        {agreement.title}
                                    </td>
                                    <td className="py-3 px-5 text-sm text-neutral-600">
                                        {agreement.party}
                                    </td>
                                    <td className="py-3 px-5 text-sm font-medium text-neutral-900">
                                        {formatINR(agreement.value)}
                                    </td>
                                    <td className="py-3 px-5">
                                        <span
                                            className={cn(
                                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                                                agreement.statusColor === 'green' &&
                                                    'bg-green-100 text-green-700',
                                                agreement.statusColor === 'amber' &&
                                                    'bg-amber-100 text-amber-700'
                                            )}
                                        >
                                            {agreement.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-5 text-sm text-neutral-600">
                                        {agreement.endDate}
                                    </td>
                                    <td className="py-3 px-5 text-right">
                                        <button className="text-neutral-400 hover:text-neutral-600">
                                            <MaterialIcon name="more_horiz" size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center">
                    <p className="text-sm text-neutral-500">
                        Showing <span className="font-medium text-neutral-900">1</span> to{' '}
                        <span className="font-medium text-neutral-900">3</span> of{' '}
                        <span className="font-medium text-neutral-900">145</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 rounded border border-neutral-300 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 text-sm"
                            disabled
                        >
                            Previous
                        </button>
                        <button className="px-3 py-1 rounded border border-neutral-300 bg-white text-neutral-500 hover:bg-neutral-50 text-sm">
                            Next
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
