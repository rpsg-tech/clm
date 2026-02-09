'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Skeleton } from '@repo/ui';
import type { Role, UserWithRoles } from '@repo/types';

interface PaginatedMeta {
    total: number;
    lastPage: number;
    currentPage: number;
    perPage: number;
    prev: number | null;
    next: number | null;
}

interface ApiOrganization {
    id: string;
    name: string;
    code?: string;
}

type ApiUserItem = UserWithRoles & {
    role?: string | { name?: string | null } | null;
    organizations?: ApiOrganization[];
    lastActive?: string | null;
    lastLoginAt?: string | null;
    isActive?: boolean;
};

interface UsersApiResponse {
    data: ApiUserItem[];
    meta: PaginatedMeta;
}

interface RolesApiResponse {
    data: Role[];
    meta: PaginatedMeta;
}

interface DisplayUser {
    id: string;
    name: string;
    email: string;
    role: string;
    roleColor: string;
    org: string;
    orgExtra: number;
    lastActive: string;
    status: string;
}

// ─── Mock data (fallback when API unavailable) ─────────────────────────────

const mockUsers = [
    { id: '1', name: 'Sarah Jenkins', email: 's.jenkins@enterprise.com', role: 'Super Admin', roleColor: 'red', org: 'Global Legal', orgExtra: 3, lastActive: '2 mins ago', status: 'active' },
    { id: '2', name: 'Michael Chen', email: 'm.chen@enterprise.com', role: 'Business User', roleColor: 'blue', org: 'Sales - NA', orgExtra: 1, lastActive: '4 hours ago', status: 'active' },
    { id: '3', name: 'David Ross', email: 'd.ross@enterprise.com', role: 'Viewer', roleColor: 'slate', org: 'Finance', orgExtra: 0, lastActive: '2 days ago', status: 'inactive' },
    { id: '4', name: 'Emily White', email: 'e.white@enterprise.com', role: 'Entity Admin', roleColor: 'teal', org: 'IP Law', orgExtra: 0, lastActive: '5 mins ago', status: 'active' },
    { id: '5', name: 'James Miller', email: 'j.miller@enterprise.com', role: 'Business User', roleColor: 'blue', org: 'Procurement', orgExtra: 1, lastActive: '1 hour ago', status: 'active' },
];

// ─── Role badge color map ──────────────────────────────────────────────────

const roleBadgeClasses: Record<string, string> = {
    'Super Admin': 'bg-red-50 text-red-700 ring-red-600/10',
    'Business User': 'bg-blue-50 text-blue-700 ring-blue-700/10',
    'Entity Admin': 'bg-teal-50 text-teal-700 ring-teal-600/20',
    'Viewer': 'bg-neutral-100 text-neutral-600 ring-neutral-500/10',
    'Legal Head': 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
    'Legal Manager': 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
    'Finance Manager': 'bg-amber-50 text-amber-700 ring-amber-600/10',
};

// ─── Avatar color palette ──────────────────────────────────────────────────

const avatarColors = [
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
    'bg-teal-100 text-teal-700',
    'bg-orange-100 text-orange-700',
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
}

// ─── Status dot + label ────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
    const dotClass =
        status === 'active'
            ? 'bg-emerald-500'
            : status === 'inactive'
              ? 'bg-neutral-300'
              : 'bg-amber-400';

    const label = status.charAt(0).toUpperCase() + status.slice(1);

    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-600">
            <span className={`h-2 w-2 rounded-full ${dotClass}`} />
            {label}
        </span>
    );
}

// ─── Page component ────────────────────────────────────────────────────────

export default function UsersPage() {
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;

    // Invite modal state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('');
    const [inviteOrgs, setInviteOrgs] = useState('');

    // ─── Data fetching ─────────────────────────────────────────────────────

    const { data: usersData, isLoading } = useQuery<UsersApiResponse>({
        queryKey: ['admin', 'users', { page, search, status: statusFilter }],
        queryFn: async () =>
            (await api.users.list({
                page,
                limit,
                search: search || undefined,
                status: statusFilter || undefined,
            })) as UsersApiResponse,
        retry: 1,
    });

    const { data: rolesData } = useQuery<RolesApiResponse>({
        queryKey: ['admin', 'roles'],
        queryFn: async () => (await api.roles.list()) as RolesApiResponse,
        retry: 1,
    });

    // ─── Invite mutation ───────────────────────────────────────────────────

    const inviteMutation = useMutation({
        mutationFn: (data: { email: string; roleId: string; name?: string; organizationIds?: string[] }) =>
            api.users.invite(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            setShowInviteModal(false);
            setInviteName('');
            setInviteEmail('');
            setInviteRole('');
            setInviteOrgs('');
        },
    });

    // ─── Normalize data ────────────────────────────────────────────────────

    const apiUsers = usersData?.data ?? [];
    const meta = usersData?.meta;
    const roleOptions = rolesData?.data ?? [];
    const hasApiData = apiUsers.length > 0;

    // Map API users to display format, or fall back to mock data
    const users = useMemo<DisplayUser[]>(() => {
        if (hasApiData) {
            return apiUsers.map((u) => {
                const roleName =
                    typeof u.role === 'string'
                        ? u.role
                        : u.role?.name ?? u.organizationRoles?.[0]?.role?.name ?? 'Unknown';

                const organizations = Array.isArray(u.organizations)
                    ? u.organizations
                    : (u.organizationRoles ?? []).flatMap((orgRole) => {
                          const org = orgRole.organization;
                          return org ? [{ id: org.id, name: org.name, code: org.code }] : [];
                      });

                const lastLogin = u.lastLoginAt ?? u.lastActive;

                return {
                    id: u.id,
                    name: u.name ?? u.email,
                    email: u.email,
                    role: roleName,
                    roleColor: '',
                    org: organizations[0]?.name ?? '-',
                    orgExtra: Math.max(0, organizations.length - 1),
                    lastActive: lastLogin ? formatTimeAgo(lastLogin) : 'Never',
                    status: u.isActive ? 'active' : 'inactive',
                };
            });
        }
        return mockUsers;
    }, [hasApiData, apiUsers]);

    // Apply client-side role filter for mock data
    const filteredUsers = useMemo<DisplayUser[]>(() => {
        let result = users;
        if (roleFilter) {
            result = result.filter((u) => u.role === roleFilter);
        }
        if (!hasApiData && statusFilter) {
            result = result.filter((u) => u.status === statusFilter);
        }
        if (!hasApiData && search) {
            const q = search.toLowerCase();
            result = result.filter(
                (u) =>
                    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
            );
        }
        return result;
    }, [users, roleFilter, statusFilter, search, hasApiData]);

    const totalUsers = hasApiData ? (meta?.total ?? filteredUsers.length) : filteredUsers.length;
    const lastPage = hasApiData ? (meta?.lastPage ?? 1) : 1;
    const showFrom = hasApiData ? ((meta?.currentPage ?? 1) - 1) * limit + 1 : 1;
    const showTo = Math.min(showFrom + filteredUsers.length - 1, totalUsers);

    // ─── Handlers ──────────────────────────────────────────────────────────

    const handleInvite = useCallback(() => {
        if (!inviteEmail || !inviteRole) return;
        const orgIds = inviteOrgs
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        inviteMutation.mutate({
            email: inviteEmail,
            roleId: inviteRole,
            name: inviteName || undefined,
            organizationIds: orgIds.length > 0 ? orgIds : undefined,
        });
    }, [inviteEmail, inviteRole, inviteName, inviteOrgs, inviteMutation]);

    // ─── Loading state ─────────────────────────────────────────────────────

    if (isLoading && !users.length) {
        return (
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-9 w-28" />
                </div>
                <Skeleton className="h-10 w-full max-w-md" />
                <div className="rounded-lg border border-neutral-200 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-neutral-100">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-56" />
                            </div>
                            <Skeleton className="h-6 w-24 rounded-md" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ─── Render ────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-neutral-900 tracking-tight">User Management</h1>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 shadow-sm transition-colors"
                >
                    <MaterialIcon name="person_add" size={18} />
                    Add User
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative max-w-md w-full">
                    <MaterialIcon
                        name="search"
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-md border-neutral-200 bg-neutral-50 py-2 pl-9 pr-4 text-sm shadow-sm ring-1 ring-neutral-200 focus:ring-1 focus:ring-indigo-700 outline-none transition-shadow"
                    />
                </div>

                {/* Role filter */}
                <div className="relative">
                    <MaterialIcon
                        name="filter_list"
                        size={16}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                        className="appearance-none rounded-md border-neutral-200 bg-white py-2 pl-8 pr-8 text-sm shadow-sm ring-1 ring-neutral-200 focus:ring-1 focus:ring-indigo-700 outline-none cursor-pointer"
                    >
                        <option value="">All Roles</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Entity Admin">Entity Admin</option>
                        <option value="Legal Head">Legal Head</option>
                        <option value="Legal Manager">Legal Manager</option>
                        <option value="Finance Manager">Finance Manager</option>
                        <option value="Business User">Business User</option>
                    </select>
                </div>

                {/* Status filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="appearance-none rounded-md border-neutral-200 bg-white py-2 pl-3 pr-8 text-sm shadow-sm ring-1 ring-neutral-200 focus:ring-1 focus:ring-indigo-700 outline-none cursor-pointer"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Data Table */}
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse text-left text-sm" aria-label="User management table">
                        <thead className="bg-neutral-50 text-neutral-500">
                            <tr>
                                <th className="w-[300px] px-6 py-3 font-medium text-xs uppercase tracking-wider">User</th>
                                <th className="w-[180px] px-6 py-3 font-medium text-xs uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Organizations</th>
                                <th className="w-[150px] px-6 py-3 font-medium text-xs uppercase tracking-wider">Last Active</th>
                                <th className="w-[100px] px-6 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                                <th className="w-[60px] px-6 py-3 font-medium text-xs uppercase tracking-wider">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="group hover:bg-neutral-50/80 transition-colors">
                                    {/* User */}
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(u.name)}`}
                                            >
                                                {getInitials(u.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-neutral-900">{u.name}</p>
                                                <p className="truncate text-xs text-neutral-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-6 py-3.5">
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${roleBadgeClasses[u.role] ?? 'bg-neutral-100 text-neutral-600 ring-neutral-500/10'}`}
                                        >
                                            {u.role}
                                        </span>
                                    </td>

                                    {/* Organizations */}
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-medium text-neutral-600">{u.org}</span>
                                            {u.orgExtra > 0 && (
                                                <span className="inline-flex items-center rounded-sm border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                                                    +{u.orgExtra}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Last Active */}
                                    <td className="px-6 py-3.5 text-xs text-neutral-500">
                                        {u.lastActive}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-3.5">
                                        <StatusDot status={u.status} />
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-3.5">
                                        <button className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors">
                                            <MaterialIcon name="more_horiz" size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-neutral-400">
                                        No users found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-6 py-3">
                    <p className="text-sm text-neutral-500">
                        Showing <span className="font-medium text-neutral-700">{showFrom}</span> to{' '}
                        <span className="font-medium text-neutral-700">{showTo}</span> of{' '}
                        <span className="font-medium text-neutral-700">{totalUsers}</span> users
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={hasApiData ? page >= lastPage : true}
                            className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {/* Total Active Users */}
                <div className="overflow-hidden rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-900/5">
                    <p className="text-sm font-medium text-neutral-500">Total Active Users</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">214</p>
                    <div className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
                        <MaterialIcon name="trending_up" size={16} />
                        <span className="font-medium">+4.5%</span>
                        <span className="text-neutral-400">vs last month</span>
                    </div>
                </div>

                {/* New This Month */}
                <div className="overflow-hidden rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-900/5">
                    <p className="text-sm font-medium text-neutral-500">New This Month</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">12</p>
                    <p className="mt-2 text-sm text-neutral-400">Target: 15</p>
                </div>

                {/* Pending Invites */}
                <div className="overflow-hidden rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-900/5">
                    <p className="text-sm font-medium text-neutral-500">Pending Invites</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">8</p>
                    <div className="mt-2 flex items-center gap-1 text-sm text-amber-600">
                        <MaterialIcon name="warning" size={16} />
                        <span className="font-medium">2 expiring soon</span>
                    </div>
                </div>
            </div>

            {/* ─── Invite Modal ──────────────────────────────────────────────── */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowInviteModal(false)}
                    />

                    {/* Modal card */}
                    <div
                        className="relative z-10 w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="invite-modal-title"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 id="invite-modal-title" className="text-base font-bold text-neutral-900">Invite New User</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                aria-label="Close invite modal"
                                className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                            >
                                <MaterialIcon name="close" size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                    placeholder="Full name"
                                    className="w-full rounded-md border-neutral-200 bg-neutral-50 py-2 px-3 text-sm shadow-sm ring-1 ring-neutral-200 focus:ring-1 focus:ring-indigo-700 outline-none"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@company.com"
                                    className="w-full rounded-md border-neutral-200 bg-neutral-50 py-2 px-3 text-sm shadow-sm ring-1 ring-neutral-200 focus:ring-1 focus:ring-indigo-700 outline-none"
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full appearance-none rounded-md border-neutral-200 bg-neutral-50 py-2 px-3 text-sm shadow-sm ring-1 ring-neutral-200 focus:ring-1 focus:ring-indigo-700 outline-none cursor-pointer"
                                >
                                    <option value="">Select a role...</option>
                                    {roleOptions.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                    {/* Fallback options when API unavailable */}
                                    {(rolesData?.data?.length ?? 0) === 0 && (
                                        <>
                                            <option value="super_admin">Super Admin</option>
                                            <option value="entity_admin">Entity Admin</option>
                                            <option value="legal_head">Legal Head</option>
                                            <option value="legal_manager">Legal Manager</option>
                                            <option value="finance_manager">Finance Manager</option>
                                            <option value="business_user">Business User</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* Organizations */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Organizations</label>
                                <input
                                    type="text"
                                    value={inviteOrgs}
                                    onChange={(e) => setInviteOrgs(e.target.value)}
                                    placeholder="Org IDs, comma-separated"
                                    className="w-full rounded-md border-neutral-200 bg-neutral-50 py-2 px-3 text-sm shadow-sm ring-1 ring-neutral-200 focus:ring-1 focus:ring-indigo-700 outline-none"
                                />
                                <p className="mt-1 text-xs text-neutral-400">Enter organization IDs separated by commas</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInvite}
                                disabled={!inviteEmail || !inviteRole || inviteMutation.isPending}
                                className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {inviteMutation.isPending ? 'Inviting...' : 'Invite User'}
                            </button>
                        </div>

                        {inviteMutation.isError && (
                            <p className="mt-3 text-sm text-red-600">
                                Failed to send invite. Please try again.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}
