
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@repo/ui';
import { usePermission } from '@/lib/auth-context';
import { useAuth } from '@/lib/auth-context';
import {
    LayoutDashboard,
    FileText,
    FileStack,
    Scale,
    Calculator,
    History,
    Settings,
    Plus,
    Users,
    Building,
    Shield
} from 'lucide-react';
import { cn } from '@repo/ui';

const navigation = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: null,
    },
    {
        name: 'Contracts',
        href: '/dashboard/contracts',
        icon: FileText,
        permission: 'contract:view',
    },
    {
        name: 'Templates',
        href: '/dashboard/templates',
        icon: FileStack,
        permission: 'template:view',
    },
    {
        name: 'Legal Approvals',
        href: '/dashboard/approvals/legal',
        icon: Scale,
        permission: 'approval:legal:view',
    },
    {
        name: 'Finance Approvals',
        href: '/dashboard/approvals/finance',
        icon: Calculator,
        permission: 'approval:finance:view',
    },
    {
        name: 'Audit Log',
        href: '/dashboard/audit',
        icon: History,
        permission: 'system:audit',
    },
    // Admin Modules
    {
        name: 'Organizations',
        href: '/dashboard/organizations',
        icon: Building,
        permission: 'org:view',
    },
    {
        name: 'Users',
        href: '/dashboard/users',
        icon: Users,
        permission: 'user:view',
    },
    {
        name: 'Roles',
        href: '/dashboard/roles',
        icon: Shield,
        permission: 'role:view',
    },
    {
        name: 'Permissions',
        href: '/dashboard/permissions',
        icon: Shield,
        permission: 'role:view', // Same permission as view roles for now
    },

];


interface DashboardSidebarProps {
    className?: string;
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
    const pathname = usePathname();
    const { permissions } = useAuth();
    const canCreateContract = usePermission('contract:create');

    const visibleNav = navigation.filter(
        (item) => !item.permission || permissions.includes(item.permission),
    );

    return (
        <aside className={cn("w-[280px] min-h-[calc(100vh-64px)] bg-neutral-50/50 border-r border-neutral-200 p-4 flex flex-col sticky top-[64px] h-[calc(100vh-64px)]", className)}>
            <div className="flex-1 space-y-1">
                <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 mt-2">
                    Menu
                </p>

                {visibleNav.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname?.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${isActive
                                ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/50'
                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-500 rounded-r-md" />
                            )}

                            <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            <div className="pt-4 border-t border-neutral-200 mt-auto space-y-2">
                {canCreateContract && (
                    <Link href="/dashboard/contracts/new">
                        <Button className="w-full bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-900/10 transition-all hover:-translate-y-0.5" size="lg">
                            <Plus className="w-4 h-4 mr-2" />
                            New Contract
                        </Button>
                    </Link>
                )}

                <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors">
                    <Settings className="w-4 h-4 text-neutral-400" />
                    Settings
                </Link>
            </div>
        </aside>
    );
}
