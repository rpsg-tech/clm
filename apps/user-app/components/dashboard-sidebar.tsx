
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@repo/ui';
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
    Shield,
    Sparkles
} from 'lucide-react';
import { Logo } from '@/components/logo';
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
    onClose?: () => void; // Added for mobile drawer closing
}

export function DashboardSidebar({ className, onClose }: DashboardSidebarProps) {
    const pathname = usePathname();
    const { permissions, user } = useAuth();
    const canCreateContract = permissions?.includes('contract:create');

    const visibleNav = navigation.filter(
        (item) => !item.permission || permissions?.includes(item.permission),
    );

    return (
        <aside className={cn("w-[280px] h-screen bg-slate-900 border-r border-slate-800 p-5 flex flex-col sticky top-0", className)}>
            {/* Logo */}
            {/* Logo */}
            <Logo className="mb-8 px-2 pl-4" />

            <div className="flex-1 flex flex-col space-y-1 overflow-y-auto -mx-2 px-2 custom-scrollbar">
                {canCreateContract && (
                    <div className="mb-6">
                        <Link href="/dashboard/contracts/new" onClick={onClose}>
                            <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] hover:shadow-orange-600/40 font-bold tracking-tight text-sm h-12 rounded-xl group relative overflow-hidden" size="lg">
                                <Plus className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-90" />
                                Create New Contract
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            </Button>
                        </Link>
                    </div>
                )}

                <div className="space-y-1.5 pb-4">
                    {visibleNav.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname?.startsWith(item.href));

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative ${isActive
                                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Footer: Settings & User */}
            <div className="pt-4 border-t border-slate-800 shrink-0 flex flex-col gap-4 bg-slate-900 z-10">
                <Link href="/dashboard/settings" onClick={onClose} className="flex items-center gap-3.5 px-3 py-2 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors group">
                    <Settings className="w-5 h-5 text-slate-500 group-hover:text-slate-300" />
                    Settings
                </Link>

                <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-800 border border-slate-700/50 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider border border-slate-600">
                        {user?.name?.substring(0, 2) || 'BU'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-white truncate">{user?.name || 'Business User'}</span>
                        <span className="text-xs text-slate-400 truncate font-medium">{user?.organizations?.[0]?.name || 'Organization'}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
