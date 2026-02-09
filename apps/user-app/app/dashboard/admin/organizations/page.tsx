'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MaterialIcon } from '@/components/ui/material-icon';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockFlags = [
    {
        name: 'AI Contract Review',
        description:
            'Enables automated risk analysis and clause extraction using GenAI models.',
        enabled: true,
        isBeta: true,
    },
    {
        name: 'SSO Enforcement',
        description:
            'Require SAML 2.0 login for all users. Disables email/password login methods.',
        enabled: false,
        isBeta: false,
    },
    {
        name: 'Audit Logs Export',
        description:
            'Allow organization admins to export activity logs via CSV or API.',
        enabled: true,
        isBeta: false,
    },
    {
        name: 'Guest Access',
        description:
            'Permit users to invite external collaborators with restricted permissions.',
        enabled: false,
        isBeta: false,
    },
];

const mockTemplates = [
    { name: 'NDA Standard', updatedAgo: '2d ago', icon: 'description' },
    { name: 'MSA Enterprise', updatedAgo: '1w ago', icon: 'gavel' },
    { name: 'Sales Order 2024', updatedAgo: '3mo ago', icon: 'receipt_long' },
];

// ─── Toggle Component ────────────────────────────────────────────────────────

function ToggleSwitch({
    enabled,
    onToggle,
}: {
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={onToggle}
            className={`relative inline-flex w-10 h-5 rounded-full transition-colors shrink-0 ${
                enabled ? 'bg-indigo-700' : 'bg-neutral-300'
            }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function OrganizationsPage() {
    // Try to load from API, fall back to mock
    useQuery({
        queryKey: ['organizations'],
        queryFn: () => api.organizations.list(),
        retry: false,
    });

    // Feature flag state
    const [flagStates, setFlagStates] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        mockFlags.forEach((f) => {
            initial[f.name] = f.enabled;
        });
        return initial;
    });

    const toggleFlag = (name: string) => {
        setFlagStates((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    return (
        <div className="max-w-5xl mx-auto py-6 px-4">
            {/* ─── Breadcrumb ─── */}
            <nav className="text-sm text-neutral-500 mb-4 flex items-center gap-1">
                <a
                    href="/dashboard/admin"
                    className="hover:text-indigo-700 transition-colors"
                >
                    Admin
                </a>
                <MaterialIcon name="chevron_right" size={16} className="text-neutral-400" />
                <span className="text-neutral-900 font-medium">Org Management</span>
            </nav>

            {/* ─── Org Header Card ─── */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-6 mb-6">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="size-14 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center shrink-0">
                        AC
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-neutral-900">Acme Corp</h1>
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                Active
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5">
                            <span className="text-sm text-neutral-500 flex items-center gap-1.5">
                                <MaterialIcon
                                    name="location_on"
                                    size={14}
                                    className="text-neutral-400"
                                />
                                NA-East (US)
                            </span>
                            <span className="text-sm text-neutral-500 flex items-center gap-1.5">
                                <MaterialIcon
                                    name="calendar_today"
                                    size={14}
                                    className="text-neutral-400"
                                />
                                Created Jan 12, 2023
                            </span>
                            <span className="text-sm text-neutral-500 flex items-center gap-1.5">
                                <MaterialIcon
                                    name="person"
                                    size={14}
                                    className="text-neutral-400"
                                />
                                CSM: Sarah Connor
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Section 1: Feature Flags ─── */}
            <section className="mb-8">
                <h2 className="text-lg font-bold text-neutral-900">Feature Flags</h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                    Manage global capabilities for this organization entity.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {mockFlags.map((flag) => (
                        <div
                            key={flag.name}
                            className="rounded-lg border border-neutral-200 bg-white p-5 flex items-start justify-between"
                        >
                            <div className="flex-1 mr-4">
                                <div className="flex items-center">
                                    <span className="text-sm font-bold text-neutral-900">
                                        {flag.name}
                                    </span>
                                    {flag.isBeta && (
                                        <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded ml-2">
                                            BETA
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                    {flag.description}
                                </p>
                            </div>
                            <ToggleSwitch
                                enabled={flagStates[flag.name] ?? false}
                                onToggle={() => toggleFlag(flag.name)}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Section 2: Template Library ─── */}
            <section className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">
                            Template Library
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Preview active templates available to this organization&apos;s
                            users.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="text-sm text-indigo-700 hover:text-indigo-800 font-medium"
                    >
                        Manage Library
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {mockTemplates.map((tpl) => (
                        <div
                            key={tpl.name}
                            className="rounded-lg border border-neutral-200 bg-white p-5 text-center hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="size-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                                <MaterialIcon name={tpl.icon} size={24} />
                            </div>
                            <div className="text-sm font-semibold text-neutral-900">
                                {tpl.name}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                                {tpl.updatedAgo}
                            </div>
                        </div>
                    ))}

                    {/* Assign Template card */}
                    <div className="rounded-lg border-2 border-dashed border-neutral-200 p-5 text-center hover:border-indigo-300 transition-colors cursor-pointer flex flex-col items-center justify-center">
                        <div className="size-10 rounded-full bg-neutral-50 text-neutral-400 flex items-center justify-center mb-2">
                            <MaterialIcon name="add" size={24} />
                        </div>
                        <span className="text-sm font-medium text-neutral-500">
                            Assign Template
                        </span>
                    </div>
                </div>
            </section>

            {/* ─── Destructive Action + Save ─── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">
                <button
                    type="button"
                    className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1.5"
                >
                    <MaterialIcon name="block" size={16} className="text-red-500" />
                    Suspend Organization
                </button>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="text-sm text-neutral-500 hover:text-neutral-700 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
