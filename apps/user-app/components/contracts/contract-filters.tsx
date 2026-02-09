'use client';

import { MaterialIcon } from '@/components/ui/material-icon';
import { Input } from '@repo/ui';
import { ContractStatus } from '@repo/types';
import { cn } from '@repo/ui';

interface ContractFiltersProps {
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    yearFilter: string;
    onYearFilterChange: (value: string) => void;
    templateTypeFilter: string;
    onTemplateTypeFilterChange: (value: string) => void;
    counterpartySearch: string;
    onCounterpartySearchChange: (value: string) => void;
    onClearFilters: () => void;
}

const STATUS_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Draft', value: ContractStatus.DRAFT },
    { label: 'Active', value: ContractStatus.EXECUTED },
    { label: 'Under Review', value: ContractStatus.LEGAL_REVIEW_IN_PROGRESS },
    { label: 'Sent to Legal', value: ContractStatus.SENT_TO_LEGAL },
    { label: 'Sent to Finance', value: ContractStatus.SENT_TO_FINANCE },
    { label: 'Approved', value: ContractStatus.APPROVED },
    { label: 'Expired', value: ContractStatus.EXPIRED },
    { label: 'Cancelled', value: ContractStatus.CANCELLED },
];

const YEAR_OPTIONS = [
    { label: 'All Years', value: '' },
    { label: '2025-2026', value: '2025-2026' },
    { label: '2024-2025', value: '2024-2025' },
    { label: '2023-2024', value: '2023-2024' },
];

const TEMPLATE_TYPE_OPTIONS = [
    { label: 'All Templates', value: '' },
    { label: 'MSA', value: 'MSA' },
    { label: 'SaaS License', value: 'SAAS_LICENSE' },
    { label: 'Professional Services', value: 'PROFESSIONAL_SERVICES' },
    { label: 'Standard NDA', value: 'NDA' },
    { label: 'Vendor Agreement', value: 'VENDOR_AGREEMENT' },
];

export function ContractFilters({
    statusFilter,
    onStatusFilterChange,
    yearFilter,
    onYearFilterChange,
    templateTypeFilter,
    onTemplateTypeFilterChange,
    counterpartySearch,
    onCounterpartySearchChange,
    onClearFilters,
}: ContractFiltersProps) {
    const hasActiveFilters = statusFilter || yearFilter || templateTypeFilter || counterpartySearch;

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <div className="relative">
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-full bg-white text-sm text-neutral-700 hover:border-neutral-300 cursor-pointer appearance-none pr-9 transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600'
                    )}
                >
                    {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            Status: {option.label}
                        </option>
                    ))}
                </select>
                <MaterialIcon
                    name="expand_more"
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
            </div>

            {/* Year Range Dropdown */}
            <div className="relative">
                <MaterialIcon
                    name="calendar_today"
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
                <select
                    value={yearFilter}
                    onChange={(e) => onYearFilterChange(e.target.value)}
                    className={cn(
                        'inline-flex items-center gap-2 pl-9 pr-9 py-2 border border-neutral-200 rounded-full bg-white text-sm text-neutral-700 hover:border-neutral-300 cursor-pointer appearance-none transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600'
                    )}
                >
                    {YEAR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <MaterialIcon
                    name="expand_more"
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
            </div>

            {/* Template Type Dropdown */}
            <div className="relative">
                <select
                    value={templateTypeFilter}
                    onChange={(e) => onTemplateTypeFilterChange(e.target.value)}
                    className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-full bg-white text-sm text-neutral-700 hover:border-neutral-300 cursor-pointer appearance-none pr-9 transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600'
                    )}
                >
                    {TEMPLATE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            Template: {option.label}
                        </option>
                    ))}
                </select>
                <MaterialIcon
                    name="expand_more"
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
            </div>

            {/* Counterparty Search */}
            <div className="relative">
                <MaterialIcon
                    name="search"
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <Input
                    placeholder="Search Counterparty..."
                    value={counterpartySearch}
                    onChange={(e) => onCounterpartySearchChange(e.target.value)}
                    className="pl-9 pr-4 h-9 w-64 text-sm border-neutral-200 rounded-full"
                />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <button
                    onClick={onClearFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
}
