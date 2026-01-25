'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { ChevronDown, ShieldCheck, Bell, LogOut, Settings, User, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function AdminHeader() {
    const router = useRouter();
    const { user, currentOrg, logout } = useAuth();
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

    if (!user) return null;

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
            <div className="flex items-center justify-between px-8 py-3 h-[64px]">
                {/* Logo & Context */}
                <div className="flex items-center gap-10">
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-2">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-slate-900 leading-none tracking-tight">
                                CLM <span className="text-orange-600">CORE</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Super Console</span>
                        </div>
                    </Link>

                    <div className="h-6 w-px bg-slate-200" />

                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
                        <Globe className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs font-bold text-slate-600 tracking-tight">System Infrastructure</span>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    <button aria-label="Notifications" className="relative p-2 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-orange-600 group active:scale-95">
                        <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                    </button>

                    <div className="h-6 w-px bg-slate-200" />

                    {/* User Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-3 py-1 pl-1 pr-2 rounded-2xl hover:bg-slate-50 transition-all duration-300 group border border-transparent hover:border-slate-100"
                        >
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
                                {(user as any).avatar ? (
                                    <img src={(user as any).avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-black text-orange-600 uppercase">{user.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="hidden md:flex flex-col items-start">
                                <span className="text-sm font-bold text-slate-900 leading-none tracking-tight">{user.name.split(' ')[0]}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Global Admin</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-500 ${isMenuOpen ? 'rotate-180 text-orange-500' : ''}`} />
                        </button>

                        {/* Dropdown */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 p-2 animate-in fade-in zoom-in-95 duration-300 origin-top-right ring-1 ring-slate-100">
                                <div className="px-4 py-4 border-b border-slate-50 mb-2">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] mb-1">Authenticated Account</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                                </div>

                                <div className="space-y-1">
                                    <button
                                        onClick={() => { router.push('/dashboard/settings'); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-orange-600 hover:bg-orange-50/50 rounded-xl transition-all font-bold"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile Settings
                                    </button>
                                    <button
                                        onClick={() => { router.push('/dashboard/settings'); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-orange-600 hover:bg-orange-50/50 rounded-xl transition-all font-bold"
                                    >
                                        <Settings className="w-4 h-4" />
                                        System Config
                                    </button>
                                </div>

                                <div className="h-px bg-slate-50 my-2 mx-2" />

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black tracking-tight"
                                >
                                    <LogOut className="w-4 h-4" />
                                    End Session
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
