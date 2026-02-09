'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useContracts } from '@/lib/hooks/use-contracts';
import { ContractTable } from '@/components/contracts/contract-table';
import { ContractFilters } from '@/components/contracts/contract-filters';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button } from '@repo/ui';
import { cn } from '@repo/ui';
import type { Contract, PaginatedResponse } from '@repo/types';

export default function ContractsPage() {
    const [statusFilter, setStatusFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [templateTypeFilter, setTemplateTypeFilter] = useState('');
    const [counterpartySearch, setCounterpartySearch] = useState('');
    const [page, setPage] = useState(1);

    const limit = 5;

    // Only pass status and search (mapped from counterpartySearch) to the API
    const { data, isLoading } = useContracts({
        status: statusFilter,
        search: counterpartySearch,
        page,
        limit,
    });

    type ContractRow = {
        id: string;
        title: string;
        counterpartyName?: string;
        status: Contract['status'];
        createdAt: string;
        endDate?: string;
        amount?: number;
        createdByUser?: { name: string };
        template?: { name: string; category?: string };
    };

    const paginatedData = data as PaginatedResponse<Contract> | undefined;
    const contracts = (paginatedData?.data ?? []).map((contract) => ({
        ...contract,
        createdAt:
            typeof contract.createdAt === 'string'
                ? contract.createdAt
                : contract.createdAt.toISOString(),
        endDate:
            contract.endDate
                ? typeof contract.endDate === 'string'
                    ? contract.endDate
                    : contract.endDate.toISOString()
                : undefined,
    })) as ContractRow[];
    const rawMeta = paginatedData?.meta;
    const totalPages = rawMeta
        ? 'lastPage' in rawMeta
            ? rawMeta.lastPage
            : rawMeta.totalPages
        : 1;
    const currentPage = rawMeta
        ? 'currentPage' in rawMeta
            ? rawMeta.currentPage
            : rawMeta.page
        : page;
    const meta = {
        total: rawMeta?.total ?? 0,
        lastPage: Number(totalPages ?? 1),
        currentPage: Number(currentPage ?? page),
    };

    const handleClearFilters = () => {
        setStatusFilter('');
        setYearFilter('');
        setTemplateTypeFilter('');
        setCounterpartySearch('');
        setPage(1);
    };

    // Calculate pagination info
    const totalItems = meta.total;
    const startItem = totalItems > 0 ? (page - 1) * limit + 1 : 0;
    const endItem = Math.min(page * limit, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const totalPages = Math.max(1, meta.lastPage);
        const currentPage = page;
        const pages: number[] = [];

        if (totalPages <= 5) {
            // Show all pages if 5 or fewer
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show current page + 2 on each side
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, currentPage + 2);

            // Adjust if at the edges to show 5 pages
            if (currentPage <= 3) {
                end = Math.min(5, totalPages);
            }
            if (currentPage >= totalPages - 2) {
                start = Math.max(1, totalPages - 4);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                        Agreements
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Manage your organization&apos;s contract inventory.
                    </p>
                </div>
                <Link href="/dashboard/contracts/create">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                        <MaterialIcon name="add" size={18} className="text-white mr-1.5" />
                        New Contract
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <ContractFilters
                statusFilter={statusFilter}
                onStatusFilterChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                }}
                yearFilter={yearFilter}
                onYearFilterChange={(v) => {
                    setYearFilter(v);
                    setPage(1);
                }}
                templateTypeFilter={templateTypeFilter}
                onTemplateTypeFilterChange={(v) => {
                    setTemplateTypeFilter(v);
                    setPage(1);
                }}
                counterpartySearch={counterpartySearch}
                onCounterpartySearchChange={(v) => {
                    setCounterpartySearch(v);
                    setPage(1);
                }}
                onClearFilters={handleClearFilters}
            />

            {/* Table */}
            <ContractTable
                contracts={contracts}
                isLoading={isLoading}
                emptyMessage={
                    statusFilter || counterpartySearch || yearFilter || templateTypeFilter
                        ? 'No contracts match your filters.'
                        : 'No contracts yet. Create your first one!'
                }
            />

            {/* Pagination */}
            {meta.lastPage > 1 && (
                <div className="flex items-center justify-between pt-2">
                    {/* Showing X to Y of Z */}
                    <p className="text-sm text-neutral-600">
                        Showing {startItem} to {endItem} of {totalItems}
                    </p>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                        {/* Previous button */}
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className={cn(
                                'size-9 flex items-center justify-center rounded-lg border transition-colors',
                                page <= 1
                                    ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                                    : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                            )}
                        >
                            <MaterialIcon name="chevron_left" size={18} />
                        </button>

                        {/* Page number buttons */}
                        {pageNumbers.map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={cn(
                                    'size-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                                    page === pageNum
                                        ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                                )}
                            >
                                {pageNum}
                            </button>
                        ))}

                        {/* Next button */}
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= meta.lastPage}
                            className={cn(
                                'size-9 flex items-center justify-center rounded-lg border transition-colors',
                                page >= meta.lastPage
                                    ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                                    : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                            )}
                        >
                            <MaterialIcon name="chevron_right" size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
