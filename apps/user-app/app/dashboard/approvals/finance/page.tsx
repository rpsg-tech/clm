'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Spinner } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { DualPaneLayout } from '@/components/layout/dual-pane-layout';
import { ApprovalQueueList, ApprovalItem } from '@/components/approval-queue-list';
import { ReviewWorkbench } from '@/components/review-workbench';
import { MaterialIcon } from '@/components/ui/material-icon';
import { PageErrorBoundary } from '@/components/error-boundary';

export default function FinanceApprovalsPage() {
    return (
        <PageErrorBoundary>
            <FinanceApprovalsContent />
        </PageErrorBoundary>
    );
}

function FinanceApprovalsContent() {
    const searchParams = useSearchParams();
    const { hasPermission } = useAuth();

    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchApprovals();
    }, []);

    // Deep Linking Logic
    useEffect(() => {
        if (!isLoading && approvals.length > 0) {
            const contractId = searchParams.get('id');
            if (contractId) {
                const target = approvals.find(a => a.contract.id === contractId);
                if (target) {
                    setSelectedId(target.id);
                }
            }
        }
    }, [isLoading, approvals, searchParams]);

    const fetchApprovals = async () => {
        setIsLoading(true);
        try {
            const data = await api.approvals.pending('FINANCE');
            const pendingApprovals = data as ApprovalItem[];
            setApprovals(pendingApprovals);

            if (pendingApprovals.length > 0 && !selectedId && !searchParams.get('id')) {
                setSelectedId(pendingApprovals[0].id);
            }
        } catch (error: any) {
            console.error('Failed to fetch finance approvals:', error);
            setError(error?.message || 'Failed to load list.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (comment: string) => {
        if (!selectedId) return;
        setActionLoading(true);
        try {
            await api.approvals.approve(selectedId, comment);
            setApprovals(prev => prev.filter(a => a.id !== selectedId));

            const currentIndex = approvals.findIndex(a => a.id === selectedId);
            const nextApproval = approvals[currentIndex + 1] || approvals[currentIndex - 1];
            setSelectedId(nextApproval ? nextApproval.id : null);

        } catch (error: any) {
            console.error('Approve failed', error);
            alert('Failed to approve: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (comment: string) => {
        if (!selectedId) return;
        setActionLoading(true);
        try {
            await api.approvals.reject(selectedId, comment);
            setApprovals(prev => prev.filter(a => a.id !== selectedId));

            const currentIndex = approvals.findIndex(a => a.id === selectedId);
            const nextApproval = approvals[currentIndex + 1] || approvals[currentIndex - 1];
            setSelectedId(nextApproval ? nextApproval.id : null);

        } catch (error: any) {
            console.error('Reject failed', error);
            alert('Failed to reject: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

    const selectedApproval = approvals.find(a => a.id === selectedId) || null;

    const header = (
        <div className="flex items-center gap-2 px-4 w-full">
            <div className="flex items-center gap-2 text-slate-500">
                <MaterialIcon name="dashboard" className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
            </div>
            <MaterialIcon name="chevron_right" className="w-4 h-4 text-slate-300" />
            <span className="text-sm font-bold text-slate-900">Finance Approvals</span>
        </div>
    );

    return (
        <DualPaneLayout
            header={header}
            leftPane={
                <ApprovalQueueList
                    approvals={approvals}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    title="Finance Review Queue"
                />
            }
            rightPane={
                <ReviewWorkbench
                    approval={selectedApproval}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isActionLoading={actionLoading}
                    role="FINANCE"
                />
            }
        />
    );
}
