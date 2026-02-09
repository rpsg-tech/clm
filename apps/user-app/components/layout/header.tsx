'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/notifications-context';
import { MaterialIcon } from '@/components/ui/material-icon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@repo/ui';

export function Header() {
    const { user, currentOrg, role, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const router = useRouter();

    async function handleLogout() {
        try {
            await logout();
            router.replace('/login');
        } catch {
            router.replace('/login');
        }
    }

    const initials = user?.name
        ? user.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : '?';

    return (
        <header className="fixed top-0 left-0 right-0 z-40 h-16 flex-shrink-0 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
            <div className="flex items-center gap-8">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-700 text-white shadow-sm">
                        <MaterialIcon name="description" size={20} className="text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-neutral-900">CLM</span>
                </div>

                {/* Search */}
                <div className="hidden md:block relative w-80 lg:w-96">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                        <MaterialIcon name="search" size={20} />
                    </span>
                    <input
                        className="w-full h-9 pl-10 pr-4 rounded-md border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="Search contracts, parties..."
                        type="text"
                        aria-label="Search contracts or parties"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button
                    className="relative text-neutral-500 hover:text-neutral-700 transition-colors"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                    <MaterialIcon name="notifications" size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
                    )}
                </button>

                {/* Divider */}
                <div className="h-6 w-px bg-neutral-200"></div>

                {/* Org Switcher */}
                {currentOrg && (
                    <button
                        onClick={() => router.push('/select-org')}
                        className="hidden sm:flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-primary transition-colors"
                        aria-label="Switch organization"
                    >
                        <MaterialIcon name="domain" size={20} />
                        {currentOrg.name}
                        <MaterialIcon name="expand_more" size={20} className="text-neutral-400" />
                    </button>
                )}

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-2">
                    <div className="hidden md:flex flex-col items-end leading-tight">
                        <span className="text-sm font-semibold text-neutral-900">{user?.name}</span>
                        <span className="text-xs text-neutral-500">{role}</span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="h-9 w-9 rounded-full bg-neutral-200 overflow-hidden border border-neutral-200 ring-2 ring-transparent hover:ring-indigo-100 transition-all flex items-center justify-center text-sm font-semibold text-neutral-700"
                                aria-label="User menu"
                            >
                                {initials}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <div className="px-3 py-2.5 bg-neutral-50 border-b border-neutral-100">
                                <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name}</p>
                                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                            </div>
                            <div className="p-1">
                                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                                    <MaterialIcon name="settings" size={16} className="mr-2 text-neutral-400" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/select-org')}>
                                    <MaterialIcon name="domain" size={16} className="mr-2 text-neutral-400" />
                                    Switch Workspace
                                </DropdownMenuItem>
                            </div>
                            <DropdownMenuSeparator />
                            <div className="p-1">
                                <DropdownMenuItem onClick={handleLogout} className="text-error focus:text-error focus:bg-error-light/50">
                                    <MaterialIcon name="logout" size={16} className="mr-2" />
                                    Sign out
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
