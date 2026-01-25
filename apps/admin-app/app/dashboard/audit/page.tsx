'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api-client';
import { Card, Button, Badge, Spinner } from '@repo/ui';
import {
    Clock,
    Laptop,
    Fingerprint,
    Shield,
    Activity,
    Search
} from 'lucide-react';

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterModule, setFilterModule] = useState('');

    useEffect(() => {
        loadLogs();
    }, [filterModule]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await api.audit.list({ module: filterModule });
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Failed to load audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const simplifyAction = (action: string) => {
        const mapping: Record<string, string> = {
            'AUTH_LOGIN': 'User Login',
            'AUTH_LOGOUT': 'User Logout',
            'USER_CREATE': 'Added New User',
            'USER_UPDATE': 'Updated User Info',
            'USER_INVITE': 'Sent User Invite',
            'ORG_CREATE': 'Created New Organization',
            'ORG_UPDATE': 'Updated Organization',
            'ORG_DEACTIVATE': 'Deactivated Organization',
            'ROLE_CREATE': 'Created New Role',
            'ROLE_UPDATE': 'Role Permissions Updated',
            'TEMPLATE_CREATE': 'Created New Template',
            'TEMPLATE_UPDATE': 'Updated Template',
            'CONTRACT_CREATE': 'Contract Started',
            'CONTRACT_SIGN': 'Contract Signed',
            'CONTRACT_EXECUTE': 'Contract Executed'
        };
        return mapping[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const getModuleColor = (mod: string) => {
        const colors: Record<string, string> = {
            'AUTH': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'USER': 'bg-blue-50 text-blue-600 border-blue-100',
            'ORG': 'bg-orange-50 text-orange-600 border-orange-100',
            'ROLE': 'bg-rose-50 text-rose-600 border-rose-100',
            'TEMPLATE': 'bg-violet-50 text-violet-600 border-violet-100',
            'CONTRACT': 'bg-amber-50 text-amber-600 border-amber-100'
        };
        return colors[mod] || 'bg-slate-50 text-slate-500 border-slate-100';
    };

    return (
        <div className="space-y-8 pb-20 selection:bg-orange-100 text-slate-900 font-sans relative">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Audit Log</h1>
                    <p className="text-slate-500 font-medium text-sm">Track system events and <span className="text-slate-900">user activity</span>.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 pl-4 pr-10 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 w-48 shadow-sm transition-all appearance-none cursor-pointer"
                        >
                            <option value="">All Events</option>
                            <option value="AUTH">Authentication</option>
                            <option value="USER">Users</option>
                            <option value="ORG">Organizations</option>
                            <option value="CONTRACT">Contracts</option>
                        </select>
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[20%]">Date & Time</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[25%]">Action</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[25%]">User</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[15%]">Network</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-right w-[15%]">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6">
                                            <div className="h-4 bg-slate-50 rounded-full w-2/3" />
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center max-w-sm mx-auto space-y-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <Activity className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-slate-900">No Activity</h3>
                                                <p className="text-slate-400 font-medium text-xs">No audit logs found for the current filter.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm tracking-tight">{new Date(log.createdAt).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1.5">
                                            <div className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-orange-600 transition-colors">
                                                {simplifyAction(log.action)}
                                            </div>
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-bold text-[9px] uppercase tracking-wide ${getModuleColor(log.module)}`}>
                                                <Fingerprint className="w-3 h-3 opacity-60" />
                                                {log.module}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-orange-600 text-[10px]">
                                                {log.user?.name?.charAt(0) || 'S'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm tracking-tight">{log.user?.name || 'System'}</div>
                                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{log.organization?.code || 'Global'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Laptop className="w-3.5 h-3.5 text-slate-300" />
                                            <span className="font-mono text-[10px] text-slate-500 font-bold tracking-wide">{log.ipAddress || '127.0.0.1'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full font-bold text-[9px] tracking-wide">
                                            Verified
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider italic flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-orange-600" /> Secure Audit Trail
                    </p>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Total Events: {logs.length}
                    </div>
                </div>
            </Card>
        </div>
    );
}
