'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Skeleton } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { ApprovalReviewList } from '@/components/approvals/approval-review-list';
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

export default function LegalApprovalsPage() {
    const searchParams = useSearchParams();
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
            const data = await api.approvals.pending('LEGAL');
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
        } catch (error: any) {
            console.error('Failed to approve:', error);
            toast.error('Failed to approve contract');
            throw error; // Re-throw so table knows it failed if needed
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



    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
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
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Queue Cleared</h2>
                <p className="text-slate-500 font-medium mt-1 max-w-sm text-sm">
                    No pending legal approvals. Great job!
                </p>
            </div>
        );
    }

    return (
        <div className="h-full">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Legal Review</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Review and approve contracts pending legal sign-off.
                    </p>
                </div>
                <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-100 uppercase tracking-wide">
                    {approvals.length} Pending
                </div>
            </div>

            <ApprovalReviewList
                data={approvals}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={isLoading}
            />
        </div>
    );
}
