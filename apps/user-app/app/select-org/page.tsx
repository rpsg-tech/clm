'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { MaterialIcon } from '@/components/ui/material-icon';

const ROLE_BADGE_STYLES: Record<string, string> = {
    LEGAL_HEAD: 'bg-indigo-700 text-white shadow-sm',
    BUSINESS_USER: 'bg-gray-100 text-gray-600 border border-gray-200',
    LEGAL_MANAGER: 'bg-blue-50 text-blue-700 border border-blue-100',
    ENTITY_ADMIN: 'bg-purple-50 text-purple-700 border border-purple-100',
    FINANCE_MANAGER: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    SUPER_ADMIN: 'bg-rose-50 text-rose-700 border border-rose-100',
};

function getRoleBadgeStyle(role: string): string {
    return ROLE_BADGE_STYLES[role] || 'bg-gray-100 text-gray-600 border border-gray-200';
}

function formatRoleLabel(role: string | undefined | null): string {
    if (!role) return 'Member';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SelectOrgPage() {
    const { user, isAuthenticated, isLoading, currentOrg, switchOrg } = useAuth();
    const router = useRouter();
    const { error: showError } = useToast();
    const [switching, setSwitching] = useState<string | null>(null);
    const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [autoRedirecting, setAutoRedirecting] = useState(false);

    const orgs = user?.organizations ?? [];
    const isSingleOrg = orgs.length === 1;

    const filteredOrgs = useMemo(() => {
        if (!search) return orgs;
        const q = search.toLowerCase();
        return orgs.filter((o) => o.name.toLowerCase().includes(q));
    }, [orgs, search]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
        if (!isLoading && isAuthenticated && currentOrg) {
            router.replace('/dashboard');
        }
    }, [isLoading, isAuthenticated, currentOrg, router]);

    // Auto-redirect for single org
    useEffect(() => {
        if (!isLoading && isAuthenticated && isSingleOrg && orgs.length > 0 && !currentOrg && !switching) {
            setAutoRedirecting(true);
            const timer = setTimeout(() => {
                handleSelectOrg(orgs[0].id);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, isAuthenticated, isSingleOrg, currentOrg, switching, orgs]);

    async function handleSelectOrg(organizationId: string) {
        setSwitching(organizationId);
        try {
            await switchOrg(organizationId);
            setSwitching(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to switch organization';
            showError('Organization switch failed', message);
            setSwitching(null);
            setAutoRedirecting(false);
        }
    }

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="w-8 h-8 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Single org: auto-redirect with animation
    if (isSingleOrg && orgs.length > 0) {
        const org = orgs[0];
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4">
                <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden text-center p-10">
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-3">
                            <div className="h-16 w-16 rounded-xl bg-white border border-neutral-100 p-1 shadow-sm flex items-center justify-center">
                                <span className="text-2xl font-bold text-neutral-700">{org.name.charAt(0)}</span>
                            </div>
                            <div className="absolute -bottom-1.5 -right-1.5 bg-green-500 text-white p-0.5 rounded-full border-2 border-white">
                                <MaterialIcon name="check" size={14} className="text-white block" />
                            </div>
                        </div>
                        <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">CLM Platform</span>
                    </div>

                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mb-8">
                        Welcome back, {user.name?.split(' ')[0]}
                    </h1>

                    <div className="w-full bg-white border border-neutral-200 rounded-xl p-4 mb-8 text-left shadow-sm">
                        <div className="flex items-start justify-between mb-1">
                            <h3 className="text-base font-semibold text-neutral-900">{org.name}</h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">Active</span>
                        </div>
                        <div className="flex items-center text-sm text-neutral-500 font-medium">
                            <span>{formatRoleLabel(org.role)}</span>
                        </div>
                    </div>

                    {autoRedirecting && (
                        <div className="w-full flex flex-col items-center gap-2 mb-8">
                            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-700 rounded-full animate-[progress_2.5s_ease-in-out_forwards]" style={{ width: '0%' }} />
                            </div>
                            <p className="text-neutral-500 text-xs font-medium animate-pulse">Entering your workspace...</p>
                        </div>
                    )}

                    <button
                        onClick={() => handleSelectOrg(org.id)}
                        disabled={!!switching}
                        className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {switching ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Go to Dashboard</span>
                                <MaterialIcon name="arrow_forward" size={18} className="text-white" />
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-8 text-neutral-400 text-xs font-medium">© 2026 CLM Enterprise</div>
            </div>
        );
    }

    // Multi-org: grid view
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-neutral-50">
            <div className="w-full max-w-5xl h-[85vh] max-h-[800px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex-none bg-white z-20 border-b border-gray-100 px-6 pt-8 pb-6 sm:px-10">
                    <div className="flex flex-col gap-1 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Welcome back, {user.name?.split(' ')[0]}
                        </h1>
                        <p className="text-gray-500 text-lg">Select an organization to access your dashboard.</p>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-700 transition-colors">
                            <MaterialIcon name="search" size={20} />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-700 focus:border-transparent focus:bg-white transition-all text-base font-medium shadow-sm hover:bg-white"
                            placeholder="Search by organization name..."
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 bg-white">
                    {filteredOrgs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <MaterialIcon name="domain_disabled" size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No organizations found</h3>
                            <p className="text-gray-500 max-w-sm">We couldn&apos;t find any organizations matching your search.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-4">
                            {filteredOrgs.map((org) => {
                                const isSelected = selectedOrg === org.id;
                                return (
                                    <button
                                        key={org.id}
                                        onClick={() => setSelectedOrg(org.id)}
                                        className={`group relative flex flex-col p-5 rounded-xl cursor-pointer transition-all duration-200 text-left ${
                                            isSelected
                                                ? 'bg-indigo-50 border-2 border-indigo-700 shadow-sm'
                                                : 'bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                                <span className="text-xl font-bold text-gray-600">{org.name.charAt(0)}</span>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide uppercase ${getRoleBadgeStyle(org.role)}`}>
                                                {formatRoleLabel(org.role)}
                                            </span>
                                        </div>
                                        <div className="mt-auto">
                                            <h3 className={`text-lg font-bold mb-1 transition-colors ${isSelected ? 'text-indigo-700' : 'text-gray-900 group-hover:text-indigo-700'}`}>
                                                {org.name}
                                            </h3>
                                            <div className="flex items-center text-sm text-gray-500 gap-1.5">
                                                <MaterialIcon name="description" size={18} />
                                                <span>#{org.code}</span>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute bottom-5 right-5 text-indigo-700">
                                                <MaterialIcon name="check_circle" size={24} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-none px-6 py-6 sm:px-10 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6 z-20">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                        <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-indigo-700 focus:ring-indigo-700/30 cursor-pointer" />
                        <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Remember my choice</span>
                    </label>
                    <button
                        onClick={() => selectedOrg && handleSelectOrg(selectedOrg)}
                        disabled={!selectedOrg || !!switching}
                        className="w-full sm:w-auto px-8 py-3 bg-indigo-700 hover:bg-indigo-800 text-white text-base font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {switching ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Continue to Workspace</span>
                                <MaterialIcon name="arrow_forward" size={20} className="text-white" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            <footer className="mt-8 text-center text-gray-400 text-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="font-bold text-gray-500">CLM</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="font-medium">Enterprise Platform</span>
                </div>
                <p>© 2026 CLM Enterprise. All rights reserved.</p>
            </footer>
        </div>
    );
}
