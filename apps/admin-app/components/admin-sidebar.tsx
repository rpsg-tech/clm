'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import {
    LayoutDashboard,
    Building,
    Users,
    Shield,
    FileText,
    Settings,
    FileStack,
    History,
    Activity,
    LifeBuoy,
    Cpu,
    Zap
} from 'lucide-react';

const navigation = [
    {
        name: 'Dashboard',
        href: '/dashboard/overview',
        icon: LayoutDashboard,
    },
    {
        name: 'Organizations',
        href: '/dashboard/organizations',
        icon: Building,
    },
    {
        name: 'Users',
        href: '/dashboard/users',
        icon: Users,
    },
    {
        name: 'Roles',
        href: '/dashboard/roles',
        icon: Shield,
    },
    {
        name: 'Templates',
        href: '/dashboard/templates',
        icon: FileStack,
    },
    {
        name: 'Audit Logs',
        href: '/dashboard/audit',
        icon: History,
    },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-[280px] min-h-[calc(100vh-64px)] bg-[#FDFDFF] border-r border-slate-200/60 flex flex-col sticky top-[64px] h-[calc(100vh-64px)] selection:bg-orange-100 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 scrollbar-hide">
                <div>
                    <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                        Core Modules
                    </h3>
                    <nav className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/dashboard/overview');

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative ${isActive
                                        ? 'bg-white text-orange-600 shadow-xl shadow-slate-200/40 border border-slate-100'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-[4px] h-6 bg-orange-600 rounded-r-full shadow-[0_0_12px_rgba(234,88,12,0.6)]" />
                                    )}

                                    <item.icon className={`w-4 h-4 transition-all duration-300 ${isActive ? 'text-orange-600 scale-110' : 'text-slate-400 group-hover:text-slate-600 group-hover:rotate-12'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div>
                    <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                        Configuration
                    </h3>
                    <div className="space-y-2">
                        <Link
                            href="/dashboard/settings"
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative ${pathname?.startsWith('/dashboard/settings')
                                ? 'bg-white text-orange-600 shadow-xl shadow-slate-200/40 border border-slate-100'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'}`}
                        >
                            {pathname?.startsWith('/dashboard/settings') && (
                                <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-[4px] h-6 bg-orange-600 rounded-r-full shadow-[0_0_12px_rgba(234,88,12,0.6)]" />
                            )}
                            <Settings className={`w-4 h-4 transition-all duration-300 ${pathname?.startsWith('/dashboard/settings') ? 'text-orange-600 scale-110' : 'text-slate-400 group-hover:text-slate-600 group-hover:rotate-12'}`} />
                            Console Settings
                        </Link>
                        <Link
                            href="#"
                            className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100/40 transition-all group"
                        >
                            <LifeBuoy className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            Help & Support
                        </Link>
                    </div>
                </div>
            </div>

            <div className="px-6 py-8 mt-auto border-t border-slate-100/60 bg-white/50 backdrop-blur-sm">
                <div className="p-6 bg-white border border-slate-100 rounded-[2rem] text-slate-900 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-orange-50/50 rounded-full blur-2xl group-hover:bg-orange-100/50 transition-colors duration-700" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Engine Status</p>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                        <div>
                            <span className="text-xl font-black block leading-none tracking-tight">Active</span>
                            <span className="text-[10px] text-slate-400 font-bold mt-1.5 block uppercase tracking-tighter">99.99% Performance</span>
                        </div>
                        <Cpu className="w-7 h-7 text-orange-100 group-hover:text-orange-600 group-hover:scale-110 transition-all duration-500" />
                    </div>
                </div>
            </div>
        </aside>
    );
}
