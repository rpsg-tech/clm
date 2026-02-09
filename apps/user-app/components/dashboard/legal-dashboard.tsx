'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useDashboardData } from '@/lib/hooks/use-dashboard';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button, Badge, Skeleton } from '@repo/ui';
import { cn } from '@repo/ui';
import { ContractStatus, type Contract } from '@repo/types';

export function LegalDashboard() {
  const { currentOrg } = useAuth();
  const { data, isLoading } = useDashboardData(currentOrg?.id);
  const [showAlert, setShowAlert] = useState(true);

  type ContractSummary = Contract & {
    contractId?: string;
    effectiveDate?: string | Date;
  };

  const stats = data?.stats;
  const recentContracts = (data?.recentContracts ?? []) as ContractSummary[];
  // Mock urgent queue items
  const urgentQueue = [
    {
      id: 1,
      icon: 'description',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      title: 'Master Service Agreement',
      subtitle: 'Needs Signature',
      status: 'needsSignature' as const,
      badgeVariant: 'warning' as const,
    },
    {
      id: 2,
      icon: 'assignment',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: 'SaaS Purchase Order',
      subtitle: 'Review Pending',
      status: 'reviewPending' as const,
      badgeVariant: 'info' as const,
    },
    {
      id: 3,
      icon: 'edit_document',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      title: 'Vendor Agreement',
      subtitle: 'Draft Mode',
      status: 'draftMode' as const,
      badgeVariant: 'default' as const,
    },
  ];

  // CSS conic-gradient donut chart data
  const chartData = {
    active: 65,
    pending: 20,
    draft: 15,
  };

  const chartGradient = `conic-gradient(
    #4338ca 0% ${chartData.active}%,
    #cbd5e1 ${chartData.active}% ${chartData.active + chartData.pending}%,
    #f1f5f9 ${chartData.active + chartData.pending}% 100%
  )`;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Contracts */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 h-28 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-primary bg-primary/10 p-1.5 rounded-lg">
                  <MaterialIcon name="description" size={20} />
                </div>
                <div className="text-sm font-medium text-neutral-600">Active Contracts</div>
              </div>
              <div className="text-3xl font-bold text-neutral-900">{stats?.activeContracts ?? 150}</div>
            </div>
            <Badge variant="success" className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
              +12%
            </Badge>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 h-28 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-orange-500 bg-orange-50 p-1.5 rounded-lg">
                  <MaterialIcon name="pending_actions" size={20} />
                </div>
                <div className="text-sm font-medium text-neutral-600">Pending Review</div>
              </div>
              <div className="text-3xl font-bold text-neutral-900">{stats?.pendingApprovals ?? 45}</div>
              <div className="text-xs text-orange-600 font-medium mt-1">Needs attention</div>
            </div>
          </div>
        </div>

        {/* Month's Value */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 h-28 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg">
                  <MaterialIcon name="currency_rupee" size={20} />
                </div>
                <div className="text-sm font-medium text-neutral-600">Month's Value (INR)</div>
              </div>
              <div className="text-3xl font-bold text-neutral-900">₹1.2 Cr</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {showAlert && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4">
          <div className="text-red-600 mt-0.5">
            <MaterialIcon name="warning" size={20} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-red-900">Action Required: 3 Contracts Expiring Soon</div>
            <div className="text-sm text-red-700 mt-1">
              These agreements need renewal decisions within the next 14 days to avoid service disruption.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlert(false)}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Review Now
            </Button>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-900">Urgent Queue</h3>
            <Link href="/dashboard/contracts" className="text-sm font-medium text-primary hover:text-primary-700">
              View All Tasks
            </Link>
          </div>
          <div className="max-h-[340px] overflow-auto">
            {urgentQueue.map((item) => (
              <div
                key={item.id}
                className="p-4 border-b border-neutral-100 last:border-b-0 flex items-center gap-4 hover:bg-neutral-50 transition-colors"
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', item.iconBg)}>
                  <MaterialIcon name={item.icon} size={20} className={item.iconColor} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">{item.title}</div>
                  <div className="text-sm text-neutral-500">{item.subtitle}</div>
                </div>
                <Badge variant={item.badgeVariant} className="text-xs">
                  {item.subtitle}
                </Badge>
                <button className="text-neutral-400 hover:text-neutral-600">
                  <MaterialIcon name="arrow_forward" size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Status Breakdown - CSS Donut Chart */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Status Breakdown</h3>
          <div className="flex flex-col items-center">
            {/* CSS Conic-Gradient Donut */}
            <div className="relative w-40 h-40 rounded-full mb-6" style={{ background: chartGradient }}>
              <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-neutral-900">207</div>
                <div className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Total</div>
              </div>
            </div>
            {/* Legend */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#4338ca]" />
                  <span className="text-neutral-600">Active</span>
                </div>
                <span className="font-bold text-neutral-900">{chartData.active}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-neutral-400" />
                  <span className="text-neutral-600">Pending</span>
                </div>
                <span className="font-bold text-neutral-900">{chartData.pending}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-neutral-200" />
                  <span className="text-neutral-600">Draft</span>
                </div>
                <span className="font-bold text-neutral-900">{chartData.draft}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Organization Agreements Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">All Organization Agreements</h3>
              <p className="text-sm text-neutral-500 mt-1">Complete overview of contracts across all departments</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <MaterialIcon name="filter_list" size={18} />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <MaterialIcon name="download" size={18} />
                Export
              </Button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Contract Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Counterparty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Effective Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Value (INR)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recentContracts.slice(0, 4).map((contract) => {
                const initials = (contract.counterpartyName || 'UK').substring(0, 2).toUpperCase();
                const colors = ['bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700'];
                const colorClass = colors[Math.floor(Math.random() * colors.length)];

                return (
                  <tr key={contract.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{contract.title || 'Untitled'}</div>
                      <div className="text-xs text-neutral-500 font-mono">#{contract.contractId || contract.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', colorClass)}>
                          {initials}
                        </div>
                        <span className="text-neutral-900">{contract.counterpartyName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={contract.status === ContractStatus.ACTIVE ? 'success' : 'default'}
                        className="text-xs"
                      >
                        {contract.status || 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 text-sm">
                      {contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-neutral-900">
                      ₹{(Math.random() * 10).toFixed(1)}L
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/contracts/${contract.id}`}>
                        <Button variant="ghost" size="sm">
                          <MaterialIcon name="arrow_forward" size={18} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-sm text-neutral-600">Showing 1 to 4 of 142</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
