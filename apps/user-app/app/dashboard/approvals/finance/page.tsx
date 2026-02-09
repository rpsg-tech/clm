'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { DollarSign } from 'lucide-react';
import { ApprovalDataTable } from '@/components/approvals/approval-data-table';
import toast from 'react-hot-toast';

interface Approval {
    id: string;
    type: string;
    status: string;
    createdAt: string;
    dueDate: string | null;
    contract: {
        id: string;
        title: string;
        reference: string;
        status: string;
        createdByUser: {
            name: string;
            email: string;
        };
    };
}

export default function FinanceApprovalsPage() {
    const router = useRouter();
    const { hasPermission } = useAuth();

    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        setIsLoading(true);
        try {
            const data = await api.approvals.pending('FINANCE');
            setApprovals(data as Approval[]);
        } catch (error: any) {
            console.error('Failed to fetch approvals:', error);
            toast.error(error?.message || 'Failed to load approvals.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string, comment?: string) => {
        try {
            await api.approvals.approve(id, comment || 'Approved from Quick Actions');
            setApprovals(prev => prev.filter(a => a.id !== id));
            toast.success('Contract approved successfully');
            router.refresh(); // Refresh stats if any
        } catch (error: any) {
            console.error('Failed to approve:', error);
            toast.error('Failed to approve contract');
            throw error;
        }
    };

    const handleReject = async (id: string, comment: string) => {
        try {
            await api.approvals.reject(id, comment);
            setApprovals(prev => prev.filter(a => a.id !== id));
            toast.success('Contract rejected');
        } catch (error: any) {
            console.error('Failed to reject:', error);
            toast.error('Failed to reject contract');
            throw error;
        }
    };

    const handleBulkApprove = async (ids: string[], comment?: string) => {
        try {
            const results = await Promise.allSettled(
                ids.map(id => api.approvals.approve(id, comment || 'Bulk Approved'))
            );

            const rejected = results.filter(r => r.status === 'rejected');
            if (rejected.length > 0) {
                toast.error(`Approved ${ids.length - rejected.length} items. ${rejected.length} failed.`);
            } else {
                toast.success(`Successfully approved ${ids.length} contracts.`);
            }

            // Refresh list
            fetchApprovals();
        } catch (error: any) {
            toast.error('Batch approval encountered errors.');
            fetchApprovals();
        }
    };

    const handleView = (id: string) => {
        const approval = approvals.find(a => a.id === id);
        if (approval) {
            router.push(`/dashboard/contracts/${approval.contract.id}`);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    if (approvals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center px-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
                    <DollarSign className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Audits Complete</h2>
                <p className="text-slate-500 font-medium mt-1 max-w-sm text-sm">
                    No pending finance reviews. Great job!
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance Review</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Verify commercial terms and approve contracts.
                    </p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 uppercase tracking-wide">
                    {approvals.length} Pending
                </div>
            </div>

            <ApprovalDataTable
                data={approvals}
                onApprove={handleApprove}
                onReject={handleReject}
                onBulkApprove={handleBulkApprove}
                onView={handleView}
                isLoading={isLoading}
            />
        </div>
    );
}
