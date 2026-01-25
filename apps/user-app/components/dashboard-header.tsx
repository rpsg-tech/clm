
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Badge } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from '@/components/notification-bell';
import { ChevronDown, Sparkles } from 'lucide-react';
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

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (!currentOrg || !user) return null;

    return (
        <header className="sticky top-0 z-50 glass border-b border-neutral-200/60 shadow-glass">
            <div className="flex items-center justify-between px-6 py-3 h-[64px]">
                {/* Logo & Org Context */}
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 transition-transform group-hover:scale-105">
                            <Sparkles className="w-4 h-4 fill-white" />
                        </div>
                        <span className="text-xl font-bold bg-neutral-900 bg-clip-text text-transparent">
                            CLM
                        </span>
                    </Link>

                    <div className="h-6 w-px bg-neutral-200" />

                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-neutral-50 transition-colors cursor-default">
                        <span className="text-sm font-semibold text-neutral-700 tracking-tight">{currentOrg.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5 font-mono shadow-none border-neutral-200 bg-neutral-100 text-neutral-500 uppercase">
                            {currentOrg.code}
                        </Badge>
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
                            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-neutral-50 transition-all border border-transparent hover:border-neutral-200"
                        >
                            <div className="flex flex-col items-end mr-1">
                                <span className="text-sm font-semibold text-neutral-900 leading-none">{user.name}</span>
                                <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wide mt-0.5">{role}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 border border-white shadow-sm flex items-center justify-center">
                                <span className="text-xs font-bold text-neutral-600">{user.name.charAt(0)}</span>
                            </div>
                            <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
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
