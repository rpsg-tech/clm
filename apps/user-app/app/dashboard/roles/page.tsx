'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Card, Button, Badge } from '@repo/ui';
import { Pagination } from '@/components/ui/pagination';
import {
    Shield,
    Plus,
    Search,
    Fingerprint,
    ArrowRight,
    ShieldCheck,
    Key,
    Ghost,
    Edit3
} from 'lucide-react';

interface Role {
    id: string;
    name: string;
    code: string;
    description: string | null;
    isSystem: boolean;
    permissionCount: number;
    permissions: string[];
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            loadRoles();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        loadRoles();
    }, [page]);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const response = await api.roles.list({
                page,
                limit: 10,
                search: searchQuery
            });
            setRoles(response.data);
            setMeta(response.meta);
        } catch (error) {
            console.error('Failed to load roles', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRoles = roles; // Server side filtered

    return (
        <div className="space-y-8 pb-20 selection:bg-orange-100 relative">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Access Control</h1>
                    <p className="text-slate-500 font-medium text-sm">Manage system-wide <span className="text-slate-900">roles and permissions</span>.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden lg:block group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search roles..."
                            className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 w-64 shadow-sm transition-all placeholder-slate-400"
                        />
                    </div>
                    <Link href="/dashboard/roles/new">
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 h-10 shadow-lg shadow-orange-600/20 border-none transition-all font-bold tracking-tight text-xs flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create New Role
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[35%]">System Role</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[20%]">Type</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[25%]">Permissions</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-right w-[20%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-8 h-8 bg-slate-50 rounded-lg" />
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-4 bg-slate-50 rounded-full w-1/4" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredRoles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center max-w-xs mx-auto space-y-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <Search className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-slate-900">No Roles Found</h3>
                                                <p className="text-slate-400 font-medium text-xs">Try adjusting your search terms.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRoles.map((role) => (
                                <tr key={role.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border
                                                ${role.isSystem
                                                    ? 'bg-slate-900 text-white border-slate-900'
                                                    : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm mb-0.5 group-hover:text-orange-600 transition-colors">{role.name}</div>
                                                <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 line-clamp-1 max-w-[200px]">
                                                    {role.description || 'No description provided'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {role.isSystem ? (
                                            <Badge className="bg-slate-100 text-slate-600 border border-slate-200 font-bold uppercase tracking-wide text-[9px] px-2 py-0.5 rounded-md">
                                                System Default
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-white text-orange-600 border border-orange-100 font-bold uppercase tracking-wide text-[9px] px-2 py-0.5 rounded-md shadow-sm">
                                                Custom Role
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-slate-100 rounded-md">
                                                <Key className="w-3 h-3 text-slate-500" />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                                                {role.permissionCount} Access Points
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-100 transition-all duration-200">
                                            <Link href={`/dashboard/roles/${role.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">Configure</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {meta && (
                <Pagination
                    meta={meta}
                    onPageChange={setPage}
                    isLoading={loading}
                />
            )}
        </div>
    );
}
