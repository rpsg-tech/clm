'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
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
    Sparkles,
    PanelLeftClose,
    PanelLeftOpen,
    FileSignature
} from 'lucide-react';
import { cn } from '@repo/ui';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

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
        permission: 'role:view',
    },
    {
        name: 'System Modules',
        href: '/dashboard/admin/modules',
        icon: Sparkles,
        permission: 'admin:config_modules',
    },
];

interface DashboardSidebarProps {
    className?: string;
    onClose?: () => void;
}

export function DashboardSidebar({ className, onClose }: DashboardSidebarProps) {
    const pathname = usePathname();
    const { permissions, user } = useAuth();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const canCreateContract = permissions?.includes('contract:create');

    const visibleNav = navigation.filter(
        (item) => !item.permission || permissions?.includes(item.permission),
    );

    // Keyboard shortcut: Cmd/Ctrl + B
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                e.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                onDoubleClick={toggleSidebar}
                className={cn(
                    "h-full bg-slate-900 border-r border-slate-800 p-5 flex flex-col transition-all duration-300 ease-in-out relative z-30",
                    "before:absolute before:right-0 before:top-0 before:bottom-0 before:w-1 before:bg-orange-500/0 hover:before:bg-orange-500/20 before:transition-colors before:pointer-events-none",
                    isCollapsed ? "w-[80px]" : "w-[280px]",
                    className
                )}
            >
                {/* Logo */}
                <div className="mb-8 flex items-center justify-between gap-3">
                    <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3">
                        {/* Consistent Logo */}
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <FileSignature className="w-6 h-6 text-white" />
                        </div>

                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-white font-black text-xl tracking-tighter leading-none">LUMINA</span>
                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Enterprise CLM</span>
                            </div>
                        )}
                    </Link>

                    {/* Toggle Button - Always Visible */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSidebar();
                                }}
                                className="w-8 h-8 text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 transition-all shrink-0 rounded-lg"
                                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                aria-expanded={!isCollapsed}
                            >
                                {isCollapsed ? (
                                    <PanelLeftOpen className="w-4 h-4" />
                                ) : (
                                    <PanelLeftClose className="w-4 h-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                            <span>{isCollapsed ? "Expand" : "Collapse"} Sidebar</span>
                            <kbd className="px-1.5 py-0.5 text-xs bg-slate-700 border border-slate-600 rounded">⌘B</kbd>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="flex-1 flex flex-col space-y-1 overflow-y-auto -mx-2 px-2 custom-scrollbar">
                    {/* Create New Contract - First Item */}
                    {canCreateContract && (
                        <div className="mb-4">
                            {isCollapsed ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/contracts/new" onClick={onClose}>
                                            <div className="flex items-center justify-center w-full h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white transition-all group cursor-pointer shadow-sm hover:shadow-orange-500/20">
                                                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
                                            </div>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={10}>
                                        Create New Contract
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <Link href="/dashboard/contracts/new" onClick={onClose}>
                                    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500/15 to-orange-600/5 border border-orange-500/20 text-orange-500 hover:from-orange-500 hover:to-orange-600 hover:text-white transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0">
                                        <div className="w-5 h-5 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-500 shrink-0" />
                                        </div>
                                        <span className="tracking-tight">Create New Contract</span>
                                    </div>
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Navigation Items */}
                    <div className="space-y-1 pb-4">
                        {visibleNav.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/dashboard' && pathname?.startsWith(item.href));

                            if (isCollapsed) {
                                return (
                                    <Tooltip key={item.name}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={item.href}
                                                onClick={onClose}
                                                className={cn(
                                                    "flex items-center justify-center w-full h-12 rounded-xl transition-all group border",
                                                    isActive
                                                        ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-sm'
                                                        : 'text-slate-400 hover:bg-orange-500/5 hover:text-orange-500 hover:border-orange-500/10 border-transparent'
                                                )}
                                            >
                                                <item.icon className={cn(
                                                    "w-5 h-5 transition-all duration-200",
                                                    isActive
                                                        ? 'text-orange-500'
                                                        : 'text-slate-500 group-hover:text-orange-500 group-hover:scale-110'
                                                )} />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={10}>
                                            {item.name}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group border",
                                        isActive
                                            ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_2px_10px_-3px_rgba(249,115,22,0.2)]'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-transparent hover:border-slate-700/50'
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-5 h-5 transition-all duration-300 shrink-0",
                                        isActive
                                            ? 'text-orange-500'
                                            : 'text-slate-500 group-hover:text-orange-400 group-hover:scale-110'
                                    )} />
                                    <span className="truncate tracking-tight">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Footer: Settings & User */}
                <div className="pt-4 border-t border-slate-800 shrink-0 flex flex-col gap-3 bg-slate-900 z-10">
                    {/* Settings Link */}
                    {isCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href="/dashboard/settings"
                                    onClick={onClose}
                                    className="flex items-center justify-center w-full h-12 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-500/5 transition-all group"
                                >
                                    <Settings className="w-5 h-5 transition-all group-hover:rotate-90 duration-500" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={10}>
                                Settings
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <Link
                            href="/dashboard/settings"
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-orange-500 hover:bg-orange-500/5 transition-all group"
                        >
                            <Settings className="w-5 h-5 text-slate-500 group-hover:text-orange-500 transition-all group-hover:rotate-90 duration-500 shrink-0" />
                            Settings
                        </Link>
                    )}

                    {/* User Profile */}
                    {isCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center justify-center w-full h-12 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:border-orange-500/20 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider shadow-sm">
                                        {user?.name?.substring(0, 2) || 'U'}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={10}>
                                <div>
                                    <div className="font-semibold text-sm">{user?.name || 'User'}</div>
                                    <div className="text-xs text-slate-400">{user?.organizations?.[0]?.name || 'Organization'}</div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider shadow-sm shrink-0">
                                {user?.name?.substring(0, 2) || 'U'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</span>
                                <span className="text-xs text-slate-400 truncate">{user?.organizations?.[0]?.name || 'Organization'}</span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </TooltipProvider>
    );
}
