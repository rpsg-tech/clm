
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Badge } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from '@/components/notification-bell';
import { ChevronDown, Sparkles, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function DashboardHeader() {
    const router = useRouter();
    const { user, currentOrg, role, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (!currentOrg || !user) return null;

    return (
        <header className="sticky top-0 z-50 glass border-b border-neutral-200/60 shadow-glass">
            <div className="flex items-center justify-between px-6 py-3 h-[64px]">
                {/* Breadcrumb / Context */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-neutral-50 transition-colors cursor-default">
                        <span className="text-sm font-semibold text-neutral-700 tracking-tight">{currentOrg.name}</span>
                        <span className="text-neutral-300">/</span>
                        <span className="text-sm font-bold text-neutral-900">Contracts</span>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-5">
                    <NotificationBell />

                    <div className="h-6 w-px bg-neutral-200" />

                    {/* User Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="rounded-full hover:bg-neutral-100 transition-all focus:outline-none focus:ring-2 focus:ring-neutral-200"
                        >
                            <div className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors">
                                <User className="w-5 h-5" />
                            </div>
                        </button>

                        {/* Dropdown */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-neutral-200 shadow-xl shadow-neutral-200/50 p-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                                    <p className="text-xs text-neutral-500 font-medium">Signed in as</p>
                                    <p className="text-sm font-semibold text-neutral-900 truncate">{user.email}</p>
                                </div>

                                {user.organizations && user.organizations.length > 1 && (
                                    <button
                                        onClick={() => router.push('/select-org')}
                                        className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors flex items-center justify-between group"
                                    >
                                        Switch Organization
                                        <kbd className="text-[10px] text-neutral-400 group-hover:text-neutral-500 font-sans border border-neutral-200 rounded px-1">⌘ O</kbd>
                                    </button>
                                )}

                                <button
                                    onClick={() => router.push('/dashboard/settings')}
                                    className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                                >
                                    Settings & Profile
                                </button>

                                <div className="h-px bg-neutral-100 my-1" />

                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error-light/30 rounded-lg transition-colors font-medium"
                                >
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
