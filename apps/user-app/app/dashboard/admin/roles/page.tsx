'use client';

import { useState, useCallback } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockRoles = [
    { id: '1', name: 'Super Admin', code: 'SUPER_ADMIN', userCount: 2 },
    { id: '2', name: 'Entity Admin', code: 'ENTITY_ADMIN', userCount: 5 },
    { id: '3', name: 'Legal Head', code: 'LEGAL_HEAD', userCount: 3 },
    { id: '4', name: 'Legal Manager', code: 'LEGAL_MANAGER', userCount: 12 },
    { id: '5', name: 'Finance Manager', code: 'FINANCE_MANAGER', userCount: 4 },
    { id: '6', name: 'Business User', code: 'BUSINESS_USER', userCount: 150 },
];

interface PermissionGroup {
    name: string;
    icon: string;
    permissions: PermissionRow[];
}

interface PermissionRow {
    id: string;
    name: string;
    description: string;
    type: 'checkbox' | 'financial';
    actions?: Record<string, boolean>;
}

function buildInitialPermissions(): PermissionGroup[] {
    return [
        {
            name: 'Contract Management',
            icon: 'description',
            permissions: [
                {
                    id: 'global_contracts',
                    name: 'Global Contract Repository',
                    description: 'Access to all contracts across mapped entities.',
                    type: 'checkbox',
                    actions: { view: true, create: false, edit: false, delete: false },
                },
                {
                    id: 'entity_contracts',
                    name: 'Entity Contracts',
                    description: 'Manage contracts specific to their entity.',
                    type: 'checkbox',
                    actions: { view: true, create: true, edit: true, delete: false },
                },
                {
                    id: 'financial_limit',
                    name: 'Financial Approval Limit',
                    description: 'Control financial approval thresholds for this role.',
                    type: 'financial',
                    actions: {},
                },
            ],
        },
        {
            name: 'Template Management',
            icon: 'topic',
            permissions: [
                {
                    id: 'master_templates',
                    name: 'Master Templates',
                    description: 'Modify standardized legal templates.',
                    type: 'checkbox',
                    actions: { view: true, create: false, edit: false, delete: false },
                },
            ],
        },
        {
            name: 'Administrative',
            icon: 'admin_panel_settings',
            permissions: [
                {
                    id: 'user_management',
                    name: 'User Management',
                    description: 'Invite and manage Business Users within entity.',
                    type: 'checkbox',
                    actions: { view: true, create: true, edit: true, delete: true },
                },
            ],
        },
    ];
}

// ─── Column definitions ──────────────────────────────────────────────────────
const ACTION_COLS = ['view', 'create', 'edit', 'delete'] as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

function ToggleSwitch({
    enabled,
    onToggle,
    ariaLabel,
}: {
    enabled: boolean;
    onToggle: () => void;
    ariaLabel?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={ariaLabel}
            onClick={onToggle}
            className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${
                enabled ? 'bg-indigo-700' : 'bg-neutral-300'
            }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

function Checkbox({
    checked,
    onChange,
    ariaLabel,
}: {
    checked: boolean;
    onChange: () => void;
    ariaLabel?: string;
}) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={onChange}
            className={`size-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                checked
                    ? 'bg-indigo-700 border-indigo-700'
                    : 'bg-white border-neutral-300 hover:border-neutral-400'
            }`}
        >
            {checked && (
                <MaterialIcon name="check" size={14} className="text-white" />
            )}
        </button>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RolesPermissionsPage() {
    const [selectedRoleId, setSelectedRoleId] = useState<string>(mockRoles[0].id);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(
        buildInitialPermissions
    );
    const [financialLimitEnabled, setFinancialLimitEnabled] = useState(true);
    const [filterText, setFilterText] = useState('');

    const selectedRole = mockRoles.find((r) => r.id === selectedRoleId)!;

    // Count active users for the selected role
    const activeUserCount = selectedRole.userCount;

    // Toggle a single permission action
    const toggleAction = useCallback(
        (groupIdx: number, permIdx: number, action: string) => {
            setPermissionGroups((prev) => {
                const next = prev.map((g, gi) => {
                    if (gi !== groupIdx) return g;
                    return {
                        ...g,
                        permissions: g.permissions.map((p, pi) => {
                            if (pi !== permIdx || p.type !== 'checkbox') return p;
                            return {
                                ...p,
                                actions: {
                                    ...p.actions,
                                    [action]: !p.actions?.[action],
                                },
                            };
                        }),
                    };
                });
                return next;
            });
        },
        []
    );

    // Select all in a group
    const toggleSelectAll = useCallback(
        (groupIdx: number) => {
            setPermissionGroups((prev) => {
                const group = prev[groupIdx];
                const checkboxPerms = group.permissions.filter(
                    (p) => p.type === 'checkbox'
                );
                const allChecked = checkboxPerms.every((p) =>
                    ACTION_COLS.every((a) => p.actions?.[a])
                );

                return prev.map((g, gi) => {
                    if (gi !== groupIdx) return g;
                    return {
                        ...g,
                        permissions: g.permissions.map((p) => {
                            if (p.type !== 'checkbox') return p;
                            const newActions: Record<string, boolean> = {};
                            ACTION_COLS.forEach((a) => {
                                newActions[a] = !allChecked;
                            });
                            return { ...p, actions: newActions };
                        }),
                    };
                });
            });
        },
        []
    );

    // Check if all are selected in a group (for checkbox state)
    const isGroupAllSelected = (groupIdx: number): boolean => {
        const group = permissionGroups[groupIdx];
        const checkboxPerms = group.permissions.filter(
            (p) => p.type === 'checkbox'
        );
        if (checkboxPerms.length === 0) return false;
        return checkboxPerms.every((p) =>
            ACTION_COLS.every((a) => p.actions?.[a])
        );
    };

    // Filter permissions
    const filteredGroups = filterText
        ? permissionGroups
              .map((g) => ({
                  ...g,
                  permissions: g.permissions.filter(
                      (p) =>
                          p.name.toLowerCase().includes(filterText.toLowerCase()) ||
                          p.description.toLowerCase().includes(filterText.toLowerCase())
                  ),
              }))
              .filter((g) => g.permissions.length > 0)
        : permissionGroups;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            {/* ─── LEFT PANEL: Role List ─── */}
            <div className="w-64 border-r border-neutral-200 bg-white flex flex-col shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                    <span className="text-sm font-bold text-neutral-900">Roles</span>
                    <button
                        type="button"
                        className="text-xs text-indigo-700 hover:text-indigo-800 font-medium flex items-center gap-0.5"
                    >
                        <MaterialIcon name="add" size={14} className="text-indigo-700" />
                        Add Role
                    </button>
                </div>

                {/* Role list */}
                <div className="flex-1 overflow-y-auto">
                    {mockRoles.map((role) => {
                        const isSelected = role.id === selectedRoleId;
                        return (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => setSelectedRoleId(role.id)}
                                className={`w-full text-left px-4 py-3 cursor-pointer transition-colors border-l-2 flex items-center justify-between ${
                                    isSelected
                                        ? 'bg-indigo-50 border-l-indigo-700'
                                        : 'hover:bg-neutral-50 border-l-transparent'
                                }`}
                            >
                                <div>
                                    <div className="text-sm font-semibold text-neutral-900">
                                        {role.name}
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        {role.userCount} Users
                                    </div>
                                </div>
                                {isSelected && (
                                    <MaterialIcon
                                        name="check"
                                        size={18}
                                        className="text-indigo-600"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-neutral-100">
                    <button
                        type="button"
                        className="text-xs text-neutral-500 hover:text-neutral-700 font-medium flex items-center gap-1.5"
                    >
                        <MaterialIcon name="download" size={14} className="text-neutral-400" />
                        Export Matrix
                    </button>
                </div>
            </div>

            {/* ─── RIGHT PANEL: Permission Matrix ─── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-neutral-900">
                                {selectedRole.name}
                            </h2>
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                                Active Role
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="text-sm text-neutral-500 hover:text-neutral-700 font-medium"
                            >
                                Discard
                            </button>
                            <button
                                type="button"
                                className="bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                        Manage access levels and functional capabilities for{' '}
                        {selectedRole.name} at Acme Corp.
                    </p>
                </div>

                {/* Filter row */}
                <div className="px-6 py-3 border-b border-neutral-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2 w-72">
                        <MaterialIcon
                            name="filter_list"
                            size={16}
                            className="text-neutral-400"
                        />
                        <input
                            type="text"
                            placeholder="Filter specific permissions..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            aria-label="Filter permissions"
                            className="bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none flex-1"
                        />
                    </div>
                    <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <MaterialIcon name="info" size={14} className="text-blue-500" />
                        Updates will reflect immediately for {activeUserCount} active users
                    </div>
                </div>

                {/* Permission matrix */}
                <div className="flex-1 overflow-y-auto px-6 py-4" role="table" aria-label="Role permissions matrix">
                    {/* Column headers */}
                    <div className="flex items-center mb-4 pb-2 border-b border-neutral-100">
                        <div className="flex-1">
                            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Feature / Permission
                            </span>
                        </div>
                        {ACTION_COLS.map((col) => (
                            <div key={col} className="w-20 text-center">
                                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    {col}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Permission groups */}
                    {filteredGroups.map((group, _groupIdx) => {
                        // Find the real index in case filter changed order
                        const realGroupIdx = permissionGroups.findIndex(
                            (g) => g.name === group.name
                        );

                        return (
                            <div key={group.name} className="mb-6">
                                {/* Group header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                            <MaterialIcon
                                                name={group.icon}
                                                size={16}
                                                className="text-indigo-600"
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-indigo-700">
                                            {group.name}
                                        </span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs text-neutral-500">Select All</span>
                                        <Checkbox
                                            checked={isGroupAllSelected(realGroupIdx)}
                                            onChange={() => toggleSelectAll(realGroupIdx)}
                                            ariaLabel={`Select all ${group.name} permissions`}
                                        />
                                    </label>
                                </div>

                                {/* Permission rows */}
                                {group.permissions.map((perm, _permIdx) => {
                                    const realPermIdx = permissionGroups[
                                        realGroupIdx
                                    ].permissions.findIndex((p) => p.id === perm.id);

                                    if (perm.type === 'financial') {
                                        return (
                                            <div
                                                key={perm.id}
                                                className="flex items-center py-3 border-b border-neutral-50"
                                            >
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-neutral-900">
                                                        {perm.name}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">
                                                        {perm.description}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <ToggleSwitch
                                                        enabled={financialLimitEnabled}
                                                        onToggle={() =>
                                                            setFinancialLimitEnabled((v) => !v)
                                                        }
                                                        ariaLabel="Toggle financial approval limit"
                                                    />
                                                    <span className="text-xs text-neutral-600 min-w-[100px]">
                                                        {financialLimitEnabled
                                                            ? '\u20B950L Limit Applied'
                                                            : 'No Limit'}
                                                    </span>
                                                    {financialLimitEnabled && (
                                                        <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                            HIGHRISK
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={perm.id}
                                            className="flex items-center py-3 border-b border-neutral-50"
                                        >
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-neutral-900">
                                                    {perm.name}
                                                </div>
                                                <div className="text-xs text-neutral-500">
                                                    {perm.description}
                                                </div>
                                            </div>
                                            {ACTION_COLS.map((action) => (
                                                <div
                                                    key={action}
                                                    className="w-20 flex justify-center"
                                                >
                                                    <Checkbox
                                                        checked={!!perm.actions?.[action]}
                                                        onChange={() =>
                                                            toggleAction(
                                                                realGroupIdx,
                                                                realPermIdx,
                                                                action
                                                            )
                                                        }
                                                        ariaLabel={`${perm.name} - ${action}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="text-xs text-neutral-400 text-center py-4 border-t border-neutral-100">
                    Copyright &copy; 2026 Acme Corp. All rights reserved.
                </div>
            </div>
        </div>
    );
}
