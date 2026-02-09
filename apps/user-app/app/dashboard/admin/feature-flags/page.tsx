'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '@/components/ui/material-icon';
import { api } from '@/lib/api-client';
import type { FeatureFlag as ApiFeatureFlag } from '@repo/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UiFeatureFlag {
    id: string;
    name: string;
    code: string;
    icon: string;
    category: string;
    description: string;
    isActive: boolean;
    comingSoon?: boolean;
}

interface Organization {
    id: string;
    name: string;
    initials: string;
    color: string;
    tier: string;
    code: string;
    usage: string;
    region: string;
    enabled: boolean;
}

type ApiFlag = ApiFeatureFlag & {
    code?: string;
    name?: string;
    icon?: string;
    category?: string;
    description?: string;
    comingSoon?: boolean;
    isActive?: boolean;
};

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_FLAGS: UiFeatureFlag[] = [
    {
        id: '1',
        name: 'AI Contract Review',
        code: 'feat_ai_review_v2',
        icon: 'psychology',
        category: 'Contract Intelligence',
        description:
            'Leverage advanced AI models to automatically review contracts for risk, compliance issues, and suggested improvements. This feature uses natural language processing to identify problematic clauses, missing provisions, and deviations from standard templates.',
        isActive: true,
    },
    {
        id: '2',
        name: 'Smart Compare',
        code: 'feat_smart_diff_v1',
        icon: 'difference',
        category: 'Contract Intelligence',
        description:
            'Intelligent document comparison that highlights semantic differences between contract versions, not just textual changes. Understands legal context to surface meaningful modifications.',
        isActive: true,
    },
    {
        id: '3',
        name: 'Advanced Routing',
        code: 'feat_adv_routing',
        icon: 'account_tree',
        category: 'Workflow',
        description:
            'Configure sophisticated approval workflows with conditional routing based on contract value, type, risk score, and organizational hierarchy. Supports parallel approvals and escalation paths.',
        isActive: true,
    },
    {
        id: '4',
        name: 'Blockchain Audit',
        code: 'feat_chain_audit',
        icon: 'lock',
        category: 'Future Release',
        description:
            'Immutable audit trail powered by blockchain technology. Every contract action is cryptographically signed and verifiable.',
        isActive: false,
        comingSoon: true,
    },
    {
        id: '5',
        name: 'NLQ Reporting',
        code: 'feat_nlq_query',
        icon: 'lock',
        category: 'Future Release',
        description:
            'Natural Language Query reporting — ask questions about your contract portfolio in plain English and get instant analytics.',
        isActive: false,
        comingSoon: true,
    },
];

const AVATAR_COLORS: Record<string, string> = {
    AC: 'bg-indigo-100 text-indigo-700',
    GI: 'bg-pink-100 text-pink-700',
    SC: 'bg-teal-100 text-teal-700',
    MD: 'bg-orange-100 text-orange-700',
    UC: 'bg-blue-100 text-blue-700',
    CS: 'bg-purple-100 text-purple-700',
};

function getAvatarColor(initials: string): string {
    if (AVATAR_COLORS[initials]) return AVATAR_COLORS[initials];
    const colors = [
        'bg-indigo-100 text-indigo-700',
        'bg-pink-100 text-pink-700',
        'bg-teal-100 text-teal-700',
        'bg-orange-100 text-orange-700',
        'bg-blue-100 text-blue-700',
        'bg-purple-100 text-purple-700',
    ];
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
        hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

const MOCK_ORGS: Organization[] = [
    { id: '1', name: 'Acme Corp', initials: 'AC', color: 'indigo', tier: 'Enterprise', code: 'org_9928_acme', usage: '1.2 Lakhs', region: 'US-East', enabled: true },
    { id: '2', name: 'Globex Inc.', initials: 'GI', color: 'pink', tier: 'Standard', code: 'org_1123_globex', usage: '0.4 Lakhs', region: 'EU-Central', enabled: false },
    { id: '3', name: 'Soylent Corp', initials: 'SC', color: 'teal', tier: 'Enterprise', code: 'org_4412_soylent', usage: '8.5 Lakhs', region: 'US-West', enabled: true },
    { id: '4', name: 'Massive Dynamic', initials: 'MD', color: 'orange', tier: 'Standard', code: 'org_8811_massive', usage: '0.05 Lakhs', region: 'APAC', enabled: false },
    { id: '5', name: 'Umbrella Corp', initials: 'UC', color: 'blue', tier: 'Enterprise', code: 'org_6660_umbrella', usage: '12.0 Lakhs', region: 'EU-West', enabled: true },
    { id: '6', name: 'Cyberdyne Systems', initials: 'CS', color: 'purple', tier: 'Startup', code: 'org_1001_cyberdyne', usage: '0.01 Lakhs', region: 'US-West', enabled: false },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ToggleSwitch({
    enabled,
    onToggle,
    disabled,
    ariaLabel,
}: {
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
    ariaLabel?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={ariaLabel}
            onClick={onToggle}
            disabled={disabled}
            className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${enabled ? 'bg-indigo-700' : 'bg-neutral-300'}`}
        >
            <span
                className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FeatureFlagsPage() {
    // ── API integration with mock fallback ──
    const { data: apiFlags } = useQuery<ApiFlag[]>({
        queryKey: ['feature-flags'],
        queryFn: () => api.featureFlags.list(),
        retry: false,
    });

    const { data: availableFlags } = useQuery<ApiFlag[]>({
        queryKey: ['feature-flags-available'],
        queryFn: () => api.featureFlags.getAvailable(),
        retry: false,
    });

    const normalizeFlag = useCallback((flag: ApiFlag): UiFeatureFlag => {
        const code = flag.featureCode ?? flag.code ?? flag.id;
        return {
            id: flag.id ?? code,
            name: flag.name ?? code,
            code,
            icon: flag.icon ?? 'flag',
            category: flag.category ?? 'General',
            description: flag.description ?? '',
            isActive: flag.isEnabled ?? flag.isActive ?? false,
            comingSoon: flag.comingSoon ?? false,
        };
    }, []);

    // Use API data if available, otherwise mock
    const flags: UiFeatureFlag[] = useMemo(() => {
        if (apiFlags && apiFlags.length > 0) {
            return apiFlags.map(normalizeFlag);
        }
        if (availableFlags && availableFlags.length > 0) {
            return availableFlags.map(normalizeFlag);
        }
        return MOCK_FLAGS;
    }, [apiFlags, availableFlags, normalizeFlag]);

    // ── State ──
    const [selectedFlagId, setSelectedFlagId] = useState<string>(MOCK_FLAGS[0].id);
    const [searchText, setSearchText] = useState('');
    const [orgFilter, setOrgFilter] = useState('');
    const [orgStatusFilter, setOrgStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

    // Track per-flag org toggle overrides: { [flagId]: { [orgId]: boolean } }
    const [toggleOverrides, setToggleOverrides] = useState<Record<string, Record<string, boolean>>>({});

    // ── Derived ──
    const selectedFlag = flags.find((f) => f.id === selectedFlagId) ?? flags[0];

    const categories = useMemo(() => {
        const map = new Map<string, UiFeatureFlag[]>();
        for (const flag of flags) {
            const existing = map.get(flag.category) || [];
            existing.push(flag);
            map.set(flag.category, existing);
        }
        return Array.from(map.entries());
    }, [flags]);

    const filteredCategories = useMemo(() => {
        if (!searchText) return categories;
        const lower = searchText.toLowerCase();
        return categories
            .map(([cat, items]) => [cat, items.filter(
                (f) =>
                    f.name.toLowerCase().includes(lower) ||
                    f.code.toLowerCase().includes(lower)
            )] as [string, UiFeatureFlag[]])
            .filter(([, items]) => items.length > 0);
    }, [categories, searchText]);

    // Get effective org state for the selected flag
    const getOrgEnabled = useCallback(
        (orgId: string, defaultEnabled: boolean) => {
            const overrides = toggleOverrides[selectedFlag.id];
            if (overrides && orgId in overrides) return overrides[orgId];
            return defaultEnabled;
        },
        [toggleOverrides, selectedFlag.id]
    );

    const filteredOrgs = useMemo(() => {
        let orgs = MOCK_ORGS;
        if (orgFilter) {
            const lower = orgFilter.toLowerCase();
            orgs = orgs.filter(
                (o) =>
                    o.name.toLowerCase().includes(lower) ||
                    o.code.toLowerCase().includes(lower)
            );
        }
        if (orgStatusFilter !== 'all') {
            orgs = orgs.filter((o) => {
                const enabled = getOrgEnabled(o.id, o.enabled);
                return orgStatusFilter === 'enabled' ? enabled : !enabled;
            });
        }
        return orgs;
    }, [orgFilter, orgStatusFilter, getOrgEnabled]);

    // ── Dirty tracking ──
    const dirtyCount = useMemo(() => {
        let count = 0;
        for (const flagId of Object.keys(toggleOverrides)) {
            const overrides = toggleOverrides[flagId];
            for (const orgId of Object.keys(overrides)) {
                const original = MOCK_ORGS.find((o) => o.id === orgId);
                if (original && overrides[orgId] !== original.enabled) {
                    count++;
                }
            }
        }
        return count;
    }, [toggleOverrides]);

    // ── Handlers ──
    const handleToggleOrg = useCallback(
        (orgId: string) => {
            setToggleOverrides((prev) => {
                const flagOverrides = { ...prev[selectedFlag.id] };
                const org = MOCK_ORGS.find((o) => o.id === orgId);
                if (!org) return prev;
                const current = orgId in flagOverrides ? flagOverrides[orgId] : org.enabled;
                flagOverrides[orgId] = !current;
                return { ...prev, [selectedFlag.id]: flagOverrides };
            });
        },
        [selectedFlag.id]
    );

    const handleEnableAll = useCallback(() => {
        setToggleOverrides((prev) => {
            const flagOverrides: Record<string, boolean> = {};
            for (const org of MOCK_ORGS) {
                flagOverrides[org.id] = true;
            }
            return { ...prev, [selectedFlag.id]: flagOverrides };
        });
    }, [selectedFlag.id]);

    const handleDisableAll = useCallback(() => {
        setToggleOverrides((prev) => {
            const flagOverrides: Record<string, boolean> = {};
            for (const org of MOCK_ORGS) {
                flagOverrides[org.id] = false;
            }
            return { ...prev, [selectedFlag.id]: flagOverrides };
        });
    }, [selectedFlag.id]);

    const handleRevert = useCallback(() => {
        setToggleOverrides({});
    }, []);

    const handleSave = useCallback(() => {
        // In real implementation, would call api.featureFlags.toggle for each change
        setToggleOverrides({});
    }, []);

    const handleCopyCode = useCallback((code: string) => {
        navigator.clipboard.writeText(code).catch(() => {
            // Fallback — noop
        });
    }, []);

    // ── Render ──
    return (
        <div className="flex h-[calc(100vh-64px)] bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden relative">
            {/* ─── LEFT SIDEBAR: Flag List ─── */}
            <div className="w-72 border-r border-neutral-200 bg-white flex flex-col shrink-0">
                {/* Header */}
                <div className="px-4 pt-5 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 mb-3">
                        Admin Controls
                    </h3>
                    <div className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                        <MaterialIcon name="search" size={16} className="text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search flags..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            aria-label="Search feature flags"
                            className="bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none flex-1"
                        />
                    </div>
                </div>

                {/* Flag list grouped by category */}
                <div className="flex-1 overflow-y-auto px-3 pb-3">
                    {filteredCategories.map(([category, items]) => (
                        <div key={category} className="mb-4">
                            <div className="text-xs font-semibold uppercase text-neutral-500 tracking-wide px-2 mb-2">
                                {category}
                            </div>
                            <div className="space-y-1">
                                {items.map((flag) => {
                                    const isSelected = flag.id === selectedFlag.id;
                                    const isDisabled = flag.comingSoon;

                                    return (
                                        <button
                                            key={flag.id}
                                            type="button"
                                            onClick={() => {
                                                if (!isDisabled) setSelectedFlagId(flag.id);
                                            }}
                                            className={`relative w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                                                isDisabled
                                                    ? 'opacity-80 cursor-not-allowed'
                                                    : isSelected
                                                    ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm'
                                                    : 'hover:bg-neutral-50 text-neutral-600'
                                            }`}
                                        >
                                            {isSelected && !isDisabled && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-700 rounded-r-md" />
                                            )}
                                            <div className="flex items-center gap-2.5">
                                                <MaterialIcon
                                                    name={flag.icon}
                                                    size={18}
                                                    className={
                                                        isSelected && !isDisabled
                                                            ? 'text-indigo-600'
                                                            : 'text-neutral-400'
                                                    }
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className={`text-sm font-medium truncate ${
                                                                isSelected && !isDisabled
                                                                    ? 'text-indigo-700'
                                                                    : 'text-neutral-700'
                                                            }`}
                                                        >
                                                            {flag.name}
                                                        </span>
                                                        {flag.comingSoon && (
                                                            <span className="bg-orange-100 text-orange-700 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded whitespace-nowrap">
                                                                Coming Soon
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`text-[10px] font-mono ${
                                                            isSelected && !isDisabled
                                                                ? 'text-indigo-500/80'
                                                                : 'text-neutral-400'
                                                        }`}
                                                    >
                                                        {flag.code}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-neutral-100 text-center">
                    <div className="text-[10px] text-neutral-500">&copy; 2026 Acme Corp.</div>
                    <div className="text-[10px] text-neutral-400">v2.4.0 (Build 8902)</div>
                </div>
            </div>

            {/* ─── RIGHT PANEL: Flag Detail + Org Toggles ─── */}
            <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
                {/* Header Card */}
                <div className="bg-white border-b border-neutral-200 p-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-neutral-900">
                                {selectedFlag.name}
                            </h2>
                            {selectedFlag.isActive ? (
                                <span className="bg-green-100 text-green-800 border border-green-200 text-xs font-semibold px-3 py-1 rounded-full">
                                    Active Feature
                                </span>
                            ) : (
                                <span className="bg-neutral-100 text-neutral-600 text-xs font-semibold px-3 py-1 rounded-full">
                                    Disabled
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-neutral-600 leading-relaxed mb-4 max-w-3xl">
                        {selectedFlag.description}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="bg-neutral-100 rounded border border-neutral-200 px-2 py-1 flex items-center gap-2">
                            <MaterialIcon name="key" size={14} className="text-neutral-400" />
                            <code className="text-xs font-mono text-indigo-700">
                                {selectedFlag.code}
                            </code>
                            <button
                                type="button"
                                onClick={() => handleCopyCode(selectedFlag.code)}
                                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                <MaterialIcon name="content_copy" size={14} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-200 rounded-lg px-3 py-1.5 transition-colors"
                            >
                                <MaterialIcon name="history" size={16} className="text-neutral-400" />
                                Audit Log
                            </button>
                            <span className="w-px h-5 bg-neutral-200" />
                            <button
                                type="button"
                                onClick={handleDisableAll}
                                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                            >
                                Disable All
                            </button>
                            <button
                                type="button"
                                onClick={handleEnableAll}
                                className="text-sm text-indigo-700 hover:text-indigo-800 font-medium transition-colors"
                            >
                                Enable All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Row */}
                <div className="px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-neutral-200 px-3 py-2 w-64">
                            <MaterialIcon name="filter_list" size={16} className="text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Filter organizations..."
                                value={orgFilter}
                                onChange={(e) => setOrgFilter(e.target.value)}
                                aria-label="Filter organizations"
                                className="bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none flex-1"
                            />
                        </div>
                        <select
                            value={orgStatusFilter}
                            onChange={(e) =>
                                setOrgStatusFilter(e.target.value as 'all' | 'enabled' | 'disabled')
                            }
                            className="bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700 outline-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                    <span className="text-sm text-neutral-500">
                        Showing {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Organization List */}
                <div className="flex-1 overflow-y-auto px-8 pb-24 space-y-3">
                    {filteredOrgs.map((org) => {
                        const enabled = getOrgEnabled(org.id, org.enabled);

                        return (
                            <div
                                key={org.id}
                                className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 flex items-center justify-between hover:border-indigo-300 transition-colors"
                            >
                                {/* Left: Avatar + Info */}
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${getAvatarColor(
                                            org.initials
                                        )}`}
                                    >
                                        {org.initials}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-neutral-900">
                                                {org.name}
                                            </span>
                                            <span className="bg-neutral-100 text-neutral-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
                                                {org.tier}
                                            </span>
                                        </div>
                                        <div className="font-mono text-xs text-neutral-500">
                                            {org.code}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Stats */}
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="text-xs text-neutral-500">Usage</div>
                                        <div className="text-sm font-medium text-neutral-700">
                                            {org.usage}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-neutral-500">Region</div>
                                        <div className="text-sm font-medium text-neutral-700">
                                            {org.region}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Toggle */}
                                <ToggleSwitch
                                    enabled={enabled}
                                    onToggle={() => handleToggleOrg(org.id)}
                                    disabled={selectedFlag.comingSoon}
                                    ariaLabel={`Toggle ${selectedFlag.name} for ${org.name}`}
                                />
                            </div>
                        );
                    })}

                    {filteredOrgs.length === 0 && (
                        <div className="text-center py-12">
                            <MaterialIcon name="search_off" size={40} className="text-neutral-300 mx-auto" />
                            <p className="text-sm text-neutral-500 mt-2">No organizations match your filters.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Floating Save Bar ─── */}
            {dirtyCount > 0 && (
                <div
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-6 z-50"
                    role="status"
                    aria-live="polite"
                    aria-label="Unsaved changes"
                >
                    <div className="flex items-center gap-3">
                        <span className="relative flex size-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                            <span className="relative inline-flex rounded-full size-3 bg-orange-500" />
                        </span>
                        <span className="text-sm font-medium">
                            {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleRevert}
                            className="text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            Revert
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
