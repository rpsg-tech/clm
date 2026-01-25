'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api-client';
import { Card, Spinner, Button, Badge } from '@repo/ui';
import {
    Users,
    Building,
    Activity,
    Calendar,
    ArrowUpRight,
    TrendingUp,
    ShieldCheck,
    ArrowRight,
    Clock,
    Terminal,
    Fingerprint,
    LayoutTemplate,
    Settings,
    History,
    Network,
    LayoutDashboard,
    AlertCircle
} from 'lucide-react';

export default function AdminOverviewPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, auditData] = await Promise.all([
                    api.analytics.getAdminStats(),
                    api.audit.list({ limit: 5 })
                ]);
                setStats(statsData);
                setRecentActivity(auditData.logs || []);
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const timeOfDay = (() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    })();

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6 animate-in fade-in duration-500">
                <Spinner size="lg" color="orange" />
                <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">Loading Portal Data...</p>
            </div>
        );
    }

    const QuickAction = ({ icon: Icon, title, desc, href, theme }: any) => {
        const themes: any = {
            blue: 'text-blue-600 group-hover:text-blue-700 bg-blue-50 group-hover:bg-blue-100',
            orange: 'text-orange-600 group-hover:text-orange-700 bg-orange-50 group-hover:bg-orange-100',
            rose: 'text-rose-600 group-hover:text-rose-700 bg-rose-50 group-hover:bg-rose-100',
            violet: 'text-violet-600 group-hover:text-violet-700 bg-violet-50 group-hover:bg-violet-100',
            amber: 'text-amber-600 group-hover:text-amber-700 bg-amber-50 group-hover:bg-amber-100',
            slate: 'text-slate-600 group-hover:text-slate-700 bg-slate-50 group-hover:bg-slate-100'
        };

        const t = themes[theme] || themes.slate;

        return (
            <Link href={href} className="group">
                <Card className="h-full bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${t}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{title}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{desc}</p>
                    </div>
                </Card>
            </Link>
        );
    };

    return (
        <div className="space-y-10 pb-20 selection:bg-orange-100 selection:text-orange-900 animate-in fade-in duration-700 relative">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {timeOfDay}, <span className="text-slate-500">{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        Admin Command Center • {currentDate}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        System Operational
                    </div>
                </div>
            </div>

            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</div>
                        <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stats?.totalUsers || 0}</h3>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">+12%</span>
                    </div>
                </Card>

                <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Organizations</div>
                        <Building className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stats?.totalOrgs || 0}</h3>
                        <span className="text-xs font-bold text-slate-400">Active</span>
                    </div>
                </Card>

                <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Templates</div>
                        <LayoutTemplate className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stats?.totalTemplates || 0}</h3>
                        <span className="text-xs font-bold text-slate-400">Library</span>
                    </div>
                </Card>

                <Card className="bg-slate-900 border border-slate-900 shadow-sm rounded-2xl p-5 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -mr-12 -marginTop-12 pointer-events-none" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="text-xs font-bold text-orange-200/60 uppercase tracking-wider">Status</div>
                        <Activity className="w-4 h-4 text-orange-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white tracking-tight relative z-10">99.9%</h3>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Core Management Hub */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Management Portals</h2>
                        <div className="h-px bg-slate-100 flex-1" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <QuickAction icon={Fingerprint} title="User Directory" desc="Manage roles & permissions." href="/dashboard/users" theme="blue" />
                        <QuickAction icon={Network} title="Organizations" desc="Hierarchy & settings." href="/dashboard/organizations" theme="orange" />
                        <QuickAction icon={ShieldCheck} title="Access Control" desc="Security policies." href="/dashboard/roles" theme="rose" />
                        <QuickAction icon={LayoutTemplate} title="Template Library" desc="Document governance." href="/dashboard/templates" theme="violet" />
                        <QuickAction icon={History} title="Audit Logs" desc="System activity tracking." href="/dashboard/audit" theme="amber" />
                        <QuickAction icon={Settings} title="Settings" desc="Global configuration." href="/dashboard/settings" theme="slate" />
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Live Activity</h2>
                        <div className="h-px bg-slate-100 flex-1" />
                    </div>

                    <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 h-fit">
                        <div className="space-y-5">
                            {recentActivity.length > 0 ? (
                                <div className="space-y-5">
                                    {recentActivity.slice(0, 5).map((log) => (
                                        <div key={log.id} className="flex items-start gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-900 leading-tight mb-0.5">
                                                    <span className="text-slate-600">{log.user?.name}</span> {log.action.toLowerCase().replace('_', ' ')}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.details ? 'Details logged' : 'System Event'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                                    <Clock className="w-5 h-5 text-slate-300" />
                                    <p className="text-xs font-medium text-slate-400">No recent activity found.</p>
                                </div>
                            )}

                            <Link href="/dashboard/audit" className="block pt-2 border-t border-slate-50">
                                <p className="text-[10px] font-bold text-center text-slate-400 hover:text-orange-600 uppercase tracking-wider cursor-pointer transition-colors">
                                    View Full History
                                </p>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
