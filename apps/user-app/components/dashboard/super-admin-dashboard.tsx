'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button, Badge } from '@repo/ui';
import { cn } from '@repo/ui';

// Mock data
const SYSTEM_STATUS = {
  status: 'Operational',
  apiLatency: '24ms',
  dbLoad: '12%',
  activeSessions: '1,240',
};



const ORGANIZATIONS = [
  {
    id: 'ORG-001',
    name: 'Acme Corporation',
    avatarColor: 'bg-blue-500',
    licenseTier: 'Enterprise',
    tierColor: 'purple' as const,
    users: { current: 1240, max: 5000 },
    usagePercent: 75,
    status: 'Active' as const,
  },
  {
    id: 'ORG-002',
    name: 'GlobalTech Industries',
    avatarColor: 'bg-green-500',
    licenseTier: 'Pro',
    tierColor: 'sky' as const,
    users: { current: 450, max: 1000 },
    usagePercent: 45,
    status: 'Active' as const,
  },
  {
    id: 'ORG-003',
    name: 'Innovate Solutions',
    avatarColor: 'bg-purple-500',
    licenseTier: 'Enterprise',
    tierColor: 'purple' as const,
    users: { current: 890, max: 2000 },
    usagePercent: 44,
    status: 'Warning' as const,
  },
  {
    id: 'ORG-004',
    name: 'DataCore Systems',
    avatarColor: 'bg-orange-500',
    licenseTier: 'Starter',
    tierColor: 'slate' as const,
    users: { current: 25, max: 50 },
    usagePercent: 50,
    status: 'Active' as const,
  },
  {
    id: 'ORG-005',
    name: 'NextGen Enterprises',
    avatarColor: 'bg-pink-500',
    licenseTier: 'Pro',
    tierColor: 'sky' as const,
    users: { current: 780, max: 1000 },
    usagePercent: 78,
    status: 'Suspended' as const,
  },
];

const AUDIT_LOG = [
  {
    timestamp: '2:45 PM',
    description: 'System backup completed successfully',
    type: 'system' as const,
  },
  {
    timestamp: '2:30 PM',
    description: 'Admin access granted to Sarah Chen',
    type: 'primary' as const,
    userName: 'Sarah Chen',
  },
  {
    timestamp: '2:15 PM',
    description: 'License tier upgraded for Acme Corporation',
    type: 'update' as const,
    orgName: 'Acme Corporation',
    metadata: 'Pro → Enterprise',
  },
  {
    timestamp: '1:58 PM',
    description: 'Multiple failed login attempts detected',
    type: 'security' as const,
    metadata: 'High Severity',
  },
  {
    timestamp: '1:45 PM',
    description: 'Database optimization completed',
    type: 'system' as const,
  },
  {
    timestamp: '1:30 PM',
    description: 'New organization GlobalTech Industries created',
    type: 'primary' as const,
    orgName: 'GlobalTech Industries',
  },
];

export function SuperAdminDashboard() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* System Status Bar */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-3 flex items-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-neutral-600">System Status</span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-neutral-900 font-medium">{SYSTEM_STATUS.status}</span>
          </div>
        </div>

        <div className="w-[1px] h-4 bg-neutral-300" />

        <div className="flex items-center gap-2">
          <span className="text-neutral-600">API Latency</span>
          <span className="font-mono text-neutral-900">{SYSTEM_STATUS.apiLatency}</span>
        </div>

        <div className="w-[1px] h-4 bg-neutral-300" />

        <div className="flex items-center gap-2">
          <span className="text-neutral-600">DB Load</span>
          <span className="font-mono text-neutral-900">{SYSTEM_STATUS.dbLoad}</span>
        </div>

        <div className="w-[1px] h-4 bg-neutral-300" />

        <div className="flex items-center gap-2">
          <span className="text-neutral-600">Active Sessions</span>
          <span className="font-mono text-neutral-900">{SYSTEM_STATUS.activeSessions}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Main Area */}
          <div className="flex-1 space-y-6">


            {/* Organizations Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
              {/* Header */}
              <div className="border-b border-neutral-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Organizations</h2>
                    <p className="text-sm text-neutral-600 mt-0.5">
                      Manage 128 enterprise clients
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm">
                      <MaterialIcon name="filter_list" size={16} />
                      Filter
                    </Button>
                    <Button size="sm">
                      <MaterialIcon name="add" size={16} />
                      Add Organization
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="text-left text-xs font-medium text-neutral-600 px-6 py-3">
                        Organization
                      </th>
                      <th className="text-left text-xs font-medium text-neutral-600 px-6 py-3">
                        License Tier
                      </th>
                      <th className="text-left text-xs font-medium text-neutral-600 px-6 py-3">
                        Users
                      </th>
                      <th className="text-left text-xs font-medium text-neutral-600 px-6 py-3">
                        Usage
                      </th>
                      <th className="text-left text-xs font-medium text-neutral-600 px-6 py-3">
                        Status
                      </th>
                      <th className="text-right text-xs font-medium text-neutral-600 px-6 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ORGANIZATIONS.map((org) => (
                      <tr key={org.id} className="border-b border-neutral-200 last:border-0">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium',
                                org.avatarColor
                              )}
                            >
                              {org.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-neutral-900">{org.name}</div>
                              <div className="text-xs text-neutral-500 font-mono">{org.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              org.tierColor === 'purple' &&
                              'bg-purple-50 text-purple-700 border-purple-200',
                              org.tierColor === 'sky' &&
                              'bg-sky-50 text-sky-700 border-sky-200',
                              org.tierColor === 'slate' &&
                              'bg-neutral-50 text-neutral-700 border-neutral-200'
                            )}
                          >
                            {org.licenseTier}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-neutral-900">
                            {org.users.current.toLocaleString()} /{' '}
                            {org.users.max.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-[120px]">
                              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-700 rounded-full transition-all"
                                  style={{ width: `${org.usagePercent}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-medium text-neutral-900 w-10 text-right">
                              {org.usagePercent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full',
                                org.status === 'Active' && 'bg-green-500',
                                org.status === 'Warning' && 'bg-amber-500',
                                org.status === 'Suspended' && 'bg-red-500'
                              )}
                            />
                            <span
                              className={cn(
                                'text-sm font-medium',
                                org.status === 'Active' && 'text-green-700',
                                org.status === 'Warning' && 'text-amber-700',
                                org.status === 'Suspended' && 'text-red-700'
                              )}
                            >
                              {org.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm">
                            <MaterialIcon name="more_horiz" size={20} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-neutral-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-neutral-600">Showing 1 to 5 of 128</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <MaterialIcon name="chevron_left" size={16} />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MaterialIcon name="chevron_right" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="xl:w-80 space-y-6">
            {/* Audit Log Timeline */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-900">Audit Log</h3>
                <Link
                  href="/dashboard/admin/audit-log"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
                >
                  View All
                </Link>
              </div>

              <div className="relative space-y-6">
                {/* Vertical timeline line */}
                <div className="absolute left-5 top-4 bottom-4 w-[1px] bg-neutral-200" />

                {AUDIT_LOG.map((event, index) => (
                  <div key={index} className="relative flex gap-4">
                    {/* Dot */}
                    <div className="relative flex-shrink-0 mt-1">
                      <span
                        className={cn(
                          'relative flex h-2.5 w-2.5 rounded-full',
                          event.type === 'primary' && 'bg-indigo-700',
                          event.type === 'system' && 'bg-neutral-300',
                          event.type === 'update' && 'bg-orange-400',
                          event.type === 'security' && 'bg-red-500'
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="text-xs text-neutral-500 font-mono mb-1">
                        {event.timestamp}
                      </div>
                      <div className="text-sm text-neutral-900">
                        {event.type === 'primary' && event.userName && (
                          <>
                            Admin access granted to{' '}
                            <span className="font-medium">{event.userName}</span>
                          </>
                        )}
                        {event.type === 'primary' && event.orgName && (
                          <>
                            New organization{' '}
                            <span className="font-medium">{event.orgName}</span> created
                          </>
                        )}
                        {event.type === 'update' && event.orgName && (
                          <>
                            License tier upgraded for{' '}
                            <span className="font-medium">{event.orgName}</span>
                          </>
                        )}
                        {event.type === 'system' && event.description}
                        {event.type === 'security' && event.description}
                      </div>
                      {event.metadata && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'mt-2',
                            event.type === 'security' &&
                            'bg-red-50 text-red-700 border-red-200',
                            event.type === 'update' &&
                            'bg-neutral-50 text-neutral-700 border-neutral-200'
                          )}
                        >
                          {event.type === 'security' && (
                            <MaterialIcon name="security" size={12} className="mr-1" />
                          )}
                          {event.metadata}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
