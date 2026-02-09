'use client';

import { useAuth } from '@/lib/auth-context';
import { useDashboardData } from '@/lib/hooks/use-dashboard';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button, Badge, Skeleton } from '@repo/ui';
import { cn } from '@repo/ui';

export function LegalHeadDashboard() {
  const { currentOrg } = useAuth();
  const { isLoading } = useDashboardData(currentOrg?.id);

  // Mock expiration alerts
  const expirationAlerts = {
    critical: [
      { id: 1, name: 'Vendor MSA', days: 5 },
      { id: 2, name: 'Cloud SaaS Agreement', days: 3 },
    ],
    upcoming: [
      { id: 3, name: 'Consulting Services', days: 18 },
      { id: 4, name: 'Office Lease', days: 22 },
      { id: 5, name: 'Marketing Agency', days: 28 },
    ],
  };

  // Mock oversight data
  const oversightData = [
    {
      id: 'CON-2025-0142',
      name: 'Enterprise Software License',
      department: 'IT',
      status: 'underReview' as const,
      value: '₹45.00 L',
      deadline: '2026-02-08',
      reviewer: 'SK',
      isDanger: true,
    },
    {
      id: 'CON-2025-0141',
      name: 'Master Service Agreement',
      department: 'Operations',
      status: 'underReview' as const,
      value: '₹120.00 L',
      deadline: '2026-02-09',
      reviewer: 'AK',
      isDanger: true,
    },
    {
      id: 'CON-2025-0140',
      name: 'Office Lease Renewal',
      department: 'Admin',
      status: 'active' as const,
      value: '₹85.00 L',
      deadline: '2026-02-15',
      reviewer: 'PM',
      isDanger: false,
    },
    {
      id: 'CON-2025-0139',
      name: 'SaaS Subscription',
      department: 'Finance',
      status: 'active' as const,
      value: '₹32.50 L',
      deadline: '2026-02-20',
      reviewer: 'RG',
      isDanger: false,
    },
    {
      id: 'CON-2025-0138',
      name: 'Consulting Agreement',
      department: 'Legal',
      status: 'draft' as const,
      value: '₹65.00 L',
      deadline: '2026-02-25',
      reviewer: 'NP',
      isDanger: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-12 gap-6">
          <Skeleton className="col-span-4 h-40 rounded-xl" />
          <Skeleton className="col-span-4 h-40 rounded-xl" />
          <Skeleton className="col-span-4 h-40 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Executive Overview</h2>
        <p className="text-sm text-neutral-500 mt-1">High-level oversight for RPSG Group entities.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Escalated Items */}
        <div className="col-span-12 xl:col-span-4 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex">
          <div className="w-1.5 h-full bg-red-500" />
          <div className="flex-1 p-6">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">ESCALATED ITEMS</div>
            <div className="text-4xl font-bold text-neutral-900 mb-3">12</div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="error" className="text-xs px-2 py-0.5">ACTION REQUIRED</Badge>
            </div>
            <div className="text-xs text-neutral-500">+3 new since yesterday</div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="col-span-12 xl:col-span-4 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex">
          <div className="w-1.5 h-full bg-amber-500" />
          <div className="flex-1 p-6">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">PENDING REVIEWS</div>
            <div className="text-4xl font-bold text-neutral-900 mb-3">28</div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="warning" className="text-xs px-2 py-0.5">IN QUEUE</Badge>
            </div>
            <div className="text-xs text-neutral-500">Awaiting legal approval</div>
          </div>
        </div>

        {/* Right column - two stacked cards */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          {/* Approved This Period */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 flex items-center gap-4">
            <div className="text-emerald-500 bg-emerald-50 p-2.5 rounded-lg">
              <MaterialIcon name="check_circle" size={24} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-neutral-500 mb-1">Approved This Period</div>
              <div className="text-2xl font-bold text-neutral-900">₹4.2 Cr</div>
            </div>
            <Badge variant="success" className="text-emerald-600 bg-emerald-50 text-xs px-2 py-0.5">
              +12%
            </Badge>
          </div>

          {/* Avg. Cycle Time */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 flex items-center gap-4">
            <div className="text-indigo-500 bg-indigo-50 p-2.5 rounded-lg">
              <MaterialIcon name="timer" size={24} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-neutral-500 mb-1">Avg. Cycle Time</div>
              <div className="text-2xl font-bold text-neutral-900">4.5 Days</div>
            </div>
            <Badge variant="success" className="text-emerald-600 bg-emerald-50 text-xs px-2 py-0.5">
              -0.5d
            </Badge>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-12 gap-6 min-h-[500px]">
        {/* Expiration Alerts Sidebar */}
        <div className="col-span-12 xl:col-span-3 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-900">Expiration Alerts</h3>
            <Badge variant="warning" className="text-xs">30 Days</Badge>
          </div>
          <div className="p-4 space-y-6">
            {/* Critical */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical (&lt; 7 Days)</span>
              </div>
              <div className="space-y-2">
                {expirationAlerts.critical.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border border-neutral-200 hover:border-red-500/20 hover:bg-red-50/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900 group-hover:text-red-900">{alert.name}</div>
                        <div className="text-xs text-neutral-500 mt-1">Expires in {alert.days} days</div>
                      </div>
                      <MaterialIcon name="priority_high" size={16} className="text-red-500 mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Upcoming (&lt; 30 Days)</span>
              </div>
              <div className="space-y-2">
                {expirationAlerts.upcoming.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border border-neutral-200 hover:border-amber-500/20 hover:bg-amber-50/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900 group-hover:text-amber-900">{alert.name}</div>
                        <div className="text-xs text-neutral-500 mt-1">Expires in {alert.days} days</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-neutral-200">
            <Button variant="outline" size="sm" className="w-full">
              View All Alerts
            </Button>
          </div>
        </div>

        {/* Contract Oversight Table */}
        <div className="col-span-12 xl:col-span-9 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-neutral-900">Contract Oversight</h3>
                <Badge variant="default" className="bg-indigo-50 text-indigo-700 text-xs">Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <MaterialIcon name="filter_list" size={18} />
                  Status: All
                </Button>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <MaterialIcon name="add" size={18} />
                  New Contract
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Contract ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Contract Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Value (INR)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Reviewer
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {oversightData.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'transition-colors',
                      item.isDanger ? 'hover:bg-red-50/30' : 'hover:bg-neutral-50'
                    )}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-neutral-600">{item.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{item.name}</div>
                      <div className="text-xs text-neutral-500">{item.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.isDanger && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                        <Badge
                          variant={
                            item.status === 'active' ? 'success' :
                            item.status === 'underReview' ? 'warning' :
                            'default'
                          }
                          className="text-xs"
                        >
                          {item.status === 'underReview' ? 'Under Review' :
                           item.status === 'active' ? 'Active' : 'Draft'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-neutral-900">{item.value}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      <span className={item.isDanger ? 'text-red-600 font-medium' : ''}>
                        {new Date(item.deadline).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {item.reviewer}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        <MaterialIcon name="more_vert" size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
            <div className="text-sm text-neutral-600">Showing 1 to 5 of 45</div>
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
    </div>
  );
}
