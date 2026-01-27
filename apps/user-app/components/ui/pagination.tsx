import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@repo/ui';

interface PaginationProps {
    meta: {
        total: number;
        lastPage: number;
        currentPage: number;
        perPage: number;
        prev: number | null;
        next: number | null;
    };
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export function Pagination({ meta, onPageChange, isLoading }: PaginationProps) {
    if (meta.total === 0) return null;

    const start = (meta.currentPage - 1) * meta.perPage + 1;
    const end = Math.min(start + meta.perPage - 1, meta.total);

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
            <div className="text-xs font-medium text-slate-500">
                Showing <span className="font-bold text-slate-900">{start}-{end}</span> of <span className="font-bold text-slate-900">{meta.total}</span>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    onClick={() => onPageChange(1)}
                    disabled={meta.currentPage === 1 || isLoading}
                >
                    <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    onClick={() => meta.prev && onPageChange(meta.prev)}
                    disabled={!meta.prev || isLoading}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="text-xs font-bold text-slate-700 w-16 text-center">
                    Page {meta.currentPage} of {meta.lastPage}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    onClick={() => meta.next && onPageChange(meta.next)}
                    disabled={!meta.next || isLoading}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    onClick={() => onPageChange(meta.lastPage)}
                    disabled={meta.currentPage === meta.lastPage || isLoading}
                >
                    <ChevronsRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
