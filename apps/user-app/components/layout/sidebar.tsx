'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { MaterialIcon } from '@/components/ui/material-icon';
import { RoleCode } from '@repo/types';
import { cn } from '@repo/ui';

interface NavItem {
    label: string;
    icon: string;
    href: string;
    roles?: RoleCode[];
}

interface NavGroup {
    title?: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        items: [
            { label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
            { label: 'Contracts', icon: 'description', href: '/dashboard/contracts' },
            {
                label: 'Create New',
                icon: 'add_circle',
                href: '/dashboard/contracts/create',
                roles: [RoleCode.BUSINESS_USER, RoleCode.LEGAL_MANAGER, RoleCode.LEGAL_HEAD, RoleCode.SUPER_ADMIN],
            },
        ],
    },
    {
        title: 'Workflows',
        items: [
            {
                label: 'Legal Review',
                icon: 'gavel',
                href: '/dashboard/approvals/legal',
                roles: [RoleCode.LEGAL_MANAGER, RoleCode.LEGAL_HEAD, RoleCode.SUPER_ADMIN],
            },
            {
                label: 'Finance Review',
                icon: 'account_balance',
                href: '/dashboard/approvals/finance',
                roles: [RoleCode.FINANCE_MANAGER],
            },
        ],
    },
    {
        title: 'Library',
        items: [
            {
                label: 'Templates',
                icon: 'folder_copy',
                href: '/dashboard/templates',
                roles: [RoleCode.LEGAL_MANAGER, RoleCode.LEGAL_HEAD, RoleCode.SUPER_ADMIN],
            },
            {
                label: 'Clauses',
                icon: 'library_books',
                href: '/dashboard/clauses',
                roles: [RoleCode.LEGAL_MANAGER, RoleCode.LEGAL_HEAD, RoleCode.SUPER_ADMIN],
            },
        ],
    },
    {
        title: 'Admin',
        items: [
            {
                label: 'Users',
                icon: 'group',
                href: '/dashboard/admin/users',
                roles: [RoleCode.LEGAL_HEAD, RoleCode.SUPER_ADMIN, RoleCode.ENTITY_ADMIN],
            },
            {
                label: 'Roles & Permissions',
                icon: 'shield_person',
                href: '/dashboard/admin/roles',
                roles: [RoleCode.SUPER_ADMIN, RoleCode.ENTITY_ADMIN],
            },
            {
                label: 'Organizations',
                icon: 'corporate_fare',
                href: '/dashboard/admin/organizations',
                roles: [RoleCode.SUPER_ADMIN],
            },
            {
                label: 'Audit Log',
                icon: 'receipt_long',
                href: '/dashboard/admin/audit',
                roles: [RoleCode.SUPER_ADMIN, RoleCode.ENTITY_ADMIN],
            },
            {
                label: 'Feature Flags',
                icon: 'flag',
                href: '/dashboard/admin/feature-flags',
                roles: [RoleCode.SUPER_ADMIN],
            },
        ],
    },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { role } = useAuth();

    function isVisible(item: NavItem): boolean {
        if (!item.roles) return true;
        if (!role) return false;
        // Validate role is a valid RoleCode before checking
        if (!Object.values(RoleCode).includes(role as RoleCode)) return false;
        return item.roles.includes(role as RoleCode);
    }

    function isActive(href: string): boolean {
        if (!pathname) return false;

        // Special case: exact match for dashboard root to prevent false positives
        // (e.g., /dashboard should not match when viewing /dashboard/contracts)
        if (href === '/dashboard') {
            return pathname === '/dashboard';
        }

        // For all other paths, use startsWith for nested route matching
        // (e.g., /dashboard/contracts should match both /dashboard/contracts and /dashboard/contracts/123)
        return pathname.startsWith(href);
    }

    return (
        <aside
            className={cn(
                'fixed left-0 top-16 bottom-0 z-30 bg-white border-r border-neutral-200 flex flex-col transition-all duration-300',
                collapsed ? 'w-[68px]' : 'w-64'
            )}
        >
            <nav aria-label="Main navigation" className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {NAV_GROUPS.map((group, gi) => {
                    const visibleItems = group.items.filter(isVisible);
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={gi}>
                            {group.title && !collapsed && (
                                <p className="px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                    {group.title}
                                </p>
                            )}
                            <ul className="space-y-1">
                                {visibleItems.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors',
                                                    active
                                                        ? 'bg-indigo-50 text-indigo-700'
                                                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                                )}
                                                title={collapsed ? item.label : undefined}
                                            >
                                                <MaterialIcon
                                                    name={item.icon}
                                                    size={20}
                                                />
                                                {!collapsed && <span>{item.label}</span>}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </nav>

            {/* Bottom section - Settings */}
            <nav className="p-4 border-t border-neutral-100">
                <Link
                    href="/dashboard/settings"
                    className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors',
                        isActive('/dashboard/settings')
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                    title={collapsed ? 'Settings' : undefined}
                >
                    <MaterialIcon name="settings" size={20} />
                    {!collapsed && <span>Settings</span>}
                </Link>
            </nav>

            {/* Collapse toggle at bottom */}
            <div className="border-t border-neutral-100 p-4">
                <button
                    onClick={onToggle}
                    className="flex items-center justify-center w-full py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <MaterialIcon
                        name={collapsed ? 'chevron_right' : 'chevron_left'}
                        size={20}
                    />
                </button>
            </div>
        </aside>
    );
}
