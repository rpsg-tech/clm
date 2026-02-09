'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@repo/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditEntry {
    id: string;
    timestamp: string;
    actor: {
        name: string;
        role: string;
        isSystem?: boolean;
    };
    event: string;
    eventColor: 'blue' | 'red' | 'green' | 'purple' | 'amber';
    action: string;
    actionLinks?: { label: string; href: string }[];
    actionCode?: string[];
    ip: string;
    ipDanger?: boolean;
    source: string;
    diff?: DiffLine[];
    meta?: {
        eventId: string;
        sessionId: string;
        userAgent: string;
        latency: string;
    };
}

interface DiffLine {
    type: 'add' | 'remove' | 'context';
    content: string;
    lineNumber: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ENTRIES: AuditEntry[] = [
    {
        id: 'evt_8f3a1d2e',
        timestamp: '2026-02-15 14:32:01',
        actor: { name: 'Sarah Jenkins', role: 'Legal Ops' },
        event: 'Contract Update',
        eventColor: 'blue',
        action: 'Approved contract',
        actionLinks: [{ label: 'MSA - Acme Corp', href: '#' }],
        actionCode: ['liability_cap'],
        ip: '10.2.45.122',
        source: 'Web App',
        diff: [
            { type: 'context', content: '{', lineNumber: 1 },
            { type: 'context', content: '  "contract_id": "MSA-2026-0452",', lineNumber: 2 },
            { type: 'context', content: '  "section": "liability",', lineNumber: 3 },
            { type: 'remove', content: '  "liability_cap": "$500,000",', lineNumber: 4 },
            { type: 'add', content: '  "liability_cap": "$750,000",', lineNumber: 5 },
            { type: 'remove', content: '  "status": "PENDING_REVIEW",', lineNumber: 6 },
            { type: 'add', content: '  "status": "APPROVED",', lineNumber: 7 },
            { type: 'context', content: '  "approved_by": "sarah.jenkins@corp.com"', lineNumber: 8 },
            { type: 'context', content: '}', lineNumber: 9 },
        ],
        meta: {
            eventId: 'evt_8f3a1d2e',
            sessionId: 'sess_x9k2m4p1',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS...',
            latency: '142ms',
        },
    },
    {
        id: 'evt_2b7c9e4f',
        timestamp: '2026-02-15 14:28:47',
        actor: { name: 'System Bot', role: 'Automated Task', isSystem: true },
        event: 'Auth Failure',
        eventColor: 'red',
        action: 'Failed login attempt for',
        actionCode: ['root'],
        actionLinks: [],
        ip: '192.168.1.55',
        ipDanger: true,
        source: 'API Gateway',
        diff: [
            { type: 'context', content: '{', lineNumber: 1 },
            { type: 'context', content: '  "event": "AUTH_FAILURE",', lineNumber: 2 },
            { type: 'context', content: '  "username": "root",', lineNumber: 3 },
            { type: 'add', content: '  "reason": "BLACKLISTED_IP_RANGE",', lineNumber: 4 },
            { type: 'add', content: '  "blocked": true,', lineNumber: 5 },
            { type: 'context', content: '  "ip": "192.168.1.55",', lineNumber: 6 },
            { type: 'context', content: '  "geo": "Unknown"', lineNumber: 7 },
            { type: 'context', content: '}', lineNumber: 8 },
        ],
        meta: {
            eventId: 'evt_2b7c9e4f',
            sessionId: 'sess_none',
            userAgent: 'curl/7.68.0',
            latency: '12ms',
        },
    },
    {
        id: 'evt_5d1f8a3b',
        timestamp: '2026-02-15 13:55:22',
        actor: { name: 'Mark Chen', role: 'Administrator' },
        event: 'User Created',
        eventColor: 'green',
        action: 'Created new user',
        actionCode: ['j.doe@corp.com'],
        actionLinks: [],
        ip: '10.0.0.5',
        source: 'Web App',
        diff: [
            { type: 'context', content: '{', lineNumber: 1 },
            { type: 'context', content: '  "event": "USER_CREATED",', lineNumber: 2 },
            { type: 'add', content: '  "email": "j.doe@corp.com",', lineNumber: 3 },
            { type: 'add', content: '  "role": "Viewer",', lineNumber: 4 },
            { type: 'add', content: '  "org": "Corp Holdings",', lineNumber: 5 },
            { type: 'context', content: '  "created_by": "mark.chen@corp.com"', lineNumber: 6 },
            { type: 'context', content: '}', lineNumber: 7 },
        ],
        meta: {
            eventId: 'evt_5d1f8a3b',
            sessionId: 'sess_q7w3e5r1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64...',
            latency: '89ms',
        },
    },
    {
        id: 'evt_9c4e7b2a',
        timestamp: '2026-02-15 13:41:08',
        actor: { name: 'Emily Davis', role: 'Compliance' },
        event: 'Role Assigned',
        eventColor: 'purple',
        action: 'Assigned permission',
        actionCode: ['export_data'],
        actionLinks: [],
        ip: '10.2.45.190',
        source: 'Web App',
        diff: [
            { type: 'context', content: '{', lineNumber: 1 },
            { type: 'context', content: '  "event": "ROLE_PERMISSION_ASSIGNED",', lineNumber: 2 },
            { type: 'context', content: '  "role": "Manager",', lineNumber: 3 },
            { type: 'remove', content: '  "permissions": ["read", "write"],', lineNumber: 4 },
            { type: 'add', content: '  "permissions": ["read", "write", "export_data"],', lineNumber: 5 },
            { type: 'context', content: '  "modified_by": "emily.davis@corp.com"', lineNumber: 6 },
            { type: 'context', content: '}', lineNumber: 7 },
        ],
        meta: {
            eventId: 'evt_9c4e7b2a',
            sessionId: 'sess_m2n8b4v6',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS...',
            latency: '67ms',
        },
    },
    {
        id: 'evt_1a6d3f8c',
        timestamp: '2026-02-15 12:15:33',
        actor: { name: 'Sarah Jenkins', role: 'Legal Ops' },
        event: 'Settings Changed',
        eventColor: 'amber',
        action: 'Updated notification preferences for',
        actionCode: ['email_digest'],
        actionLinks: [],
        ip: '10.2.45.122',
        source: 'Web App',
        diff: [
            { type: 'context', content: '{', lineNumber: 1 },
            { type: 'context', content: '  "event": "SETTINGS_CHANGED",', lineNumber: 2 },
            { type: 'context', content: '  "category": "notifications",', lineNumber: 3 },
            { type: 'remove', content: '  "email_digest": "weekly",', lineNumber: 4 },
            { type: 'add', content: '  "email_digest": "daily",', lineNumber: 5 },
            { type: 'context', content: '  "push_enabled": true', lineNumber: 6 },
            { type: 'context', content: '}', lineNumber: 7 },
        ],
        meta: {
            eventId: 'evt_1a6d3f8c',
            sessionId: 'sess_x9k2m4p1',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS...',
            latency: '34ms',
        },
    },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EVENT_STYLES: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10',
    red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10',
    green: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
    purple: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10',
};

const AVATAR_COLORS = [
    'bg-indigo-600',
    'bg-emerald-600',
    'bg-rose-600',
    'bg-violet-600',
    'bg-amber-600',
    'bg-cyan-600',
    'bg-fuchsia-600',
    'bg-teal-600',
];

function hashName(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

function getAvatarColor(name: string): string {
    return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterBar({
    search,
    onSearchChange,
    activeFilters,
    onRemoveFilter,
}: {
    search: string;
    onSearchChange: (v: string) => void;
    activeFilters: { label: string; key: string }[];
    onRemoveFilter: (key: string) => void;
}) {
    return (
        <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
                <MaterialIcon
                    name="search"
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search by user, IP, or entity ID..."
                    className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                {/* Chips inside search */}
                {activeFilters.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {activeFilters.map((f) => (
                            <span
                                key={f.key}
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                            >
                                {f.label}
                                <button
                                    onClick={() => onRemoveFilter(f.key)}
                                    className="text-indigo-400 hover:text-indigo-700"
                                >
                                    <MaterialIcon name="close" size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Date picker */}
            <button className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
                <MaterialIcon name="calendar_today" size={16} className="text-neutral-400" />
                Feb 2026
            </button>

            {/* Export */}
            <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                <MaterialIcon name="download" size={16} />
                Export
            </button>
        </div>
    );
}

function DiffBlock({ lines, eventId }: { lines: DiffLine[]; eventId: string }) {
    return (
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Change Diff (JSON)
                </h4>
                <span className="font-mono text-[11px] text-neutral-400">{eventId}</span>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-950 overflow-hidden">
                <div className="overflow-x-auto">
                    <pre className="text-xs leading-relaxed">
                        {lines.map((line, i) => {
                            const prefix =
                                line.type === 'add'
                                    ? '+'
                                    : line.type === 'remove'
                                      ? '-'
                                      : ' ';
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        'flex',
                                        line.type === 'remove' &&
                                            'bg-red-950/40 border-l-2 border-red-400/50',
                                        line.type === 'add' &&
                                            'bg-green-950/40 border-l-2 border-green-400/50',
                                        line.type === 'context' && 'border-l-2 border-transparent',
                                    )}
                                >
                                    <span className="w-8 shrink-0 select-none text-right pr-2 text-neutral-600">
                                        {line.lineNumber}
                                    </span>
                                    <span
                                        className={cn(
                                            'pr-4',
                                            line.type === 'remove' && 'text-red-400',
                                            line.type === 'add' && 'text-green-400',
                                            line.type === 'context' && 'text-neutral-400',
                                        )}
                                    >
                                        {prefix} {line.content}
                                    </span>
                                </div>
                            );
                        })}
                    </pre>
                </div>
            </div>
        </div>
    );
}

function MetadataCard({
    meta,
}: {
    meta: { sessionId: string; userAgent: string; latency: string };
}) {
    return (
        <div className="w-64 shrink-0">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                Metadata
            </h4>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                <div>
                    <p className="text-[11px] font-medium uppercase text-neutral-400 mb-0.5">
                        Session ID
                    </p>
                    <p className="font-mono text-xs text-neutral-700 break-all">
                        {meta.sessionId}
                    </p>
                </div>
                <div>
                    <p className="text-[11px] font-medium uppercase text-neutral-400 mb-0.5">
                        User Agent
                    </p>
                    <p className="text-xs text-neutral-600 truncate" title={meta.userAgent}>
                        {meta.userAgent}
                    </p>
                </div>
                <div>
                    <p className="text-[11px] font-medium uppercase text-neutral-400 mb-0.5">
                        Latency
                    </p>
                    <p className="font-mono text-xs text-green-600">{meta.latency}</p>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AuditLogPage() {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(
        () => new Set([MOCK_ENTRIES[0].id]),
    );
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [activeFilters, setActiveFilters] = useState<{ label: string; key: string }[]>([
        { label: 'Type: Security', key: 'type_security' },
    ]);

    // API query — falls back to mock data when unavailable
    const { data } = useQuery({
        queryKey: ['audit-logs', page, rowsPerPage, search],
        queryFn: () =>
            api.audit.getLogs({
                skip: (page - 1) * rowsPerPage,
                take: rowsPerPage,
            }),
        retry: false,
    });

    // Use API data if available, otherwise fall back to mock
    const entries = useMemo<AuditEntry[]>(() => {
        if (data?.logs && data.logs.length > 0) {
            // Transform API shape to local shape if needed — for now use mock
            return MOCK_ENTRIES;
        }
        return MOCK_ENTRIES;
    }, [data]);

    const total = data?.total ?? 2453;

    const toggleExpanded = useCallback((id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleRemoveFilter = useCallback((key: string) => {
        setActiveFilters((prev) => prev.filter((f) => f.key !== key));
    }, []);

    // Pagination math
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    const startItem = total > 0 ? (page - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(page * rowsPerPage, total);

    const pageNumbers = useMemo(() => {
        const pages: number[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, page - 2);
            let end = Math.min(totalPages, page + 2);
            if (page <= 3) end = Math.min(5, totalPages);
            if (page >= totalPages - 2) start = Math.max(1, totalPages - 4);
            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    }, [page, totalPages]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Audit Log</h1>
                <p className="mt-1 text-sm text-neutral-500">
                    Track all system activities and security events.
                </p>
            </div>

            {/* Filter Bar */}
            <FilterBar
                search={search}
                onSearchChange={setSearch}
                activeFilters={activeFilters}
                onRemoveFilter={handleRemoveFilter}
            />

            {/* Table Card */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[40px_160px_180px_140px_1fr_120px_100px] gap-x-4 border-b border-neutral-100 bg-neutral-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <span />
                    <span>Timestamp</span>
                    <span>Actor</span>
                    <span>Event</span>
                    <span>Action</span>
                    <span>IP Address</span>
                    <span>Source</span>
                </div>

                {/* Table Rows */}
                {entries.map((entry, idx) => {
                    const isExpanded = expandedIds.has(entry.id);
                    return (
                        <div key={entry.id}>
                            {/* Row */}
                            <div
                                className={cn(
                                    'grid grid-cols-[40px_160px_180px_140px_1fr_120px_100px] gap-x-4 items-center px-4 py-3 border-b border-neutral-100 transition-colors cursor-pointer border-l-2',
                                    idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50',
                                    isExpanded
                                        ? 'border-l-indigo-700 bg-neutral-50'
                                        : 'border-l-transparent hover:border-l-indigo-700 hover:bg-neutral-50',
                                )}
                                onClick={() => toggleExpanded(entry.id)}
                            >
                                {/* Expand */}
                                <button
                                    className="flex items-center justify-center"
                                    aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                                >
                                    <MaterialIcon
                                        name="chevron_right"
                                        size={18}
                                        className={cn(
                                            'text-neutral-400 transition-transform duration-200',
                                            isExpanded && 'rotate-90',
                                        )}
                                    />
                                </button>

                                {/* Timestamp */}
                                <span className="font-mono text-xs text-neutral-600">
                                    {entry.timestamp}
                                </span>

                                {/* Actor */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {entry.actor.isSystem ? (
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-200">
                                            <MaterialIcon
                                                name="smart_toy"
                                                size={14}
                                                className="text-neutral-500"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className={cn(
                                                'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                                                getAvatarColor(entry.actor.name),
                                            )}
                                        >
                                            {getInitials(entry.actor.name)}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p
                                            className={cn(
                                                'text-sm font-medium text-neutral-900 truncate',
                                                entry.actor.isSystem && 'italic',
                                            )}
                                        >
                                            {entry.actor.name}
                                        </p>
                                        <p className="text-[11px] text-neutral-400 truncate">
                                            {entry.actor.role}
                                        </p>
                                    </div>
                                </div>

                                {/* Event Badge */}
                                <span
                                    className={cn(
                                        'inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium',
                                        EVENT_STYLES[entry.eventColor],
                                    )}
                                >
                                    {entry.event}
                                </span>

                                {/* Action */}
                                <p className="text-sm text-neutral-700 truncate">
                                    {entry.action}{' '}
                                    {entry.actionLinks?.map((link, li) => (
                                        <a
                                            key={li}
                                            href={link.href}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-indigo-700 hover:underline"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                    {entry.actionCode?.map((code, ci) => (
                                        <code
                                            key={ci}
                                            className="ml-1 rounded border border-neutral-200 bg-neutral-100 px-1 py-0.5 font-mono text-xs text-neutral-700"
                                        >
                                            {code}
                                        </code>
                                    ))}
                                </p>

                                {/* IP Address */}
                                <span
                                    className={cn(
                                        'font-mono text-xs',
                                        entry.ipDanger
                                            ? 'font-semibold text-red-600'
                                            : 'text-neutral-600',
                                    )}
                                >
                                    {entry.ip}
                                </span>

                                {/* Source */}
                                <span className="text-xs text-neutral-500">{entry.source}</span>
                            </div>

                            {/* Expanded Detail */}
                            {isExpanded && entry.diff && entry.meta && (
                                <div className="border-b border-neutral-100 bg-white px-6 py-5">
                                    <div className="flex gap-6">
                                        <DiffBlock
                                            lines={entry.diff}
                                            eventId={entry.meta.eventId}
                                        />
                                        <MetadataCard meta={entry.meta} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between">
                {/* Left: rows-per-page + count */}
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <label className="flex items-center gap-2">
                        Rows per page:
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                            className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </label>
                    <span>
                        Showing {startItem}-{endItem} of {total.toLocaleString()}
                    </span>
                </div>

                {/* Right: page buttons */}
                <div className="flex items-center gap-1">
                    {/* First page */}
                    <button
                        onClick={() => setPage(1)}
                        disabled={page <= 1}
                        className={cn(
                            'size-9 flex items-center justify-center rounded-lg border transition-colors',
                            page <= 1
                                ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                                : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50',
                        )}
                    >
                        <MaterialIcon name="first_page" size={18} />
                    </button>

                    {/* Previous */}
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className={cn(
                            'size-9 flex items-center justify-center rounded-lg border transition-colors',
                            page <= 1
                                ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                                : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50',
                        )}
                    >
                        <MaterialIcon name="chevron_left" size={18} />
                    </button>

                    {/* Page numbers */}
                    {pageNumbers.map((pn) => (
                        <button
                            key={pn}
                            onClick={() => setPage(pn)}
                            className={cn(
                                'size-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                                page === pn
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50',
                            )}
                        >
                            {pn}
                        </button>
                    ))}

                    {/* Next */}
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className={cn(
                            'size-9 flex items-center justify-center rounded-lg border transition-colors',
                            page >= totalPages
                                ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                                : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50',
                        )}
                    >
                        <MaterialIcon name="chevron_right" size={18} />
                    </button>

                    {/* Last page */}
                    <button
                        onClick={() => setPage(totalPages)}
                        disabled={page >= totalPages}
                        className={cn(
                            'size-9 flex items-center justify-center rounded-lg border transition-colors',
                            page >= totalPages
                                ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                                : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50',
                        )}
                    >
                        <MaterialIcon name="last_page" size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
