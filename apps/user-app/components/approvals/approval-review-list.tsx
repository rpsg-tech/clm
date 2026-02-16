'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, CardContent } from '@repo/ui';
import { CheckCircle, XCircle, Clock, FileText, ArrowRight, User, Calendar, Building2, AlertCircle } from 'lucide-react';
import { ApprovalActionsCell } from './approval-actions-cell';
import { useRouter } from 'next/navigation';

export interface Approval {
    id: string
    type: string
    status: string
    comment: string | null
    createdAt: string
    contract: {
        id: string
        title: string
        reference: string
        status: string
        amount?: number
        createdByUser: {
            name: string
            email?: string
        }
        counterpartyName?: string
        counterpartyBusinessName?: string
        auditLogs?: Array<{
            id: string
            action: string
            createdAt: string
            metadata: any
            user: { name: string }
        }>
    }
}

interface ApprovalReviewListProps {
    data: Approval[];
    onApprove: (id: string, comment?: string) => Promise<void>;
    onReject: (id: string, comment: string) => Promise<void>;
    isLoading: boolean;
}

export function ApprovalReviewList({ data, onApprove, onReject, isLoading }: ApprovalReviewListProps) {
    const router = useRouter();

    const timeSince = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">All Caught Up</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                    You have no pending approvals at this time.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {data.map((item) => (
                <div
                    key={item.id}
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative"
                >
                    {/* Status Indicator Stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />

                    <div className="p-5 flex flex-col md:flex-row gap-6 md:items-center">

                        {/* 1. Main Contract Info */}
                        <div className="flex-1 min-w-0 pl-2">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    {item.contract.reference}
                                </span>
                                {item.contract.status === 'PENDING_LEGAL_HEAD' && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider border border-amber-100">
                                        <AlertCircle className="w-3 h-3" /> Escalated
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors cursor-pointer truncate" onClick={() => router.push(`/dashboard/contracts/${item.contract.id}`)}>
                                {item.contract.title}
                            </h3>

                            {/* Comment Thread */}
                            {item.contract.auditLogs && item.contract.auditLogs.length > 0 && (
                                <div className="mt-3 space-y-2 border-l-2 border-slate-100 pl-4 py-1 ml-1">
                                    {item.contract.auditLogs.map((log) => {
                                        const metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
                                        const comment = metadata?.comment || metadata?.reason;
                                        if (!comment) return null;

                                        const formatAction = (action: string) => {
                                            if (action === 'CONTRACT_REJECTED') return 'Rejected';
                                            if (action === 'CONTRACT_REVISION_REQUESTED') return 'Revision Requested';
                                            if (action === 'CONTRACT_ESCALATED') return 'Escalated';
                                            if (action === 'CONTRACT_RETURNED_TO_MANAGER') return 'Returned';
                                            if (action === 'CONTRACT_SUBMITTED') return 'Submitted';
                                            if (action === 'CONTRACT_APPROVED') return 'Approved';
                                            return 'Updated';
                                        };

                                        return (
                                            <div key={log.id} className="text-xs">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-700">{log.user.name}</span>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 border border-slate-100 px-1 rounded">
                                                        {formatAction(log.action)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium ml-auto">
                                                        {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 italic leading-relaxed bg-slate-50/50 p-2 rounded-md border border-slate-100/50">
                                                    {comment}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                        {item.contract.createdByUser.name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-slate-700">{item.contract.createdByUser.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{item.contract.counterpartyBusinessName || item.contract.counterpartyName || 'Unknown Counterparty'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                                    <span className="font-mono font-medium text-slate-700">
                                        {formatCurrency(item.contract.amount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Timing & Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 border-t md:border-t-0 md:border-l border-slate-50 md:border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">

                            {/* Timing */}
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium bg-slate-50 px-2.5 py-1.5 rounded-full">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending for {timeSince(item.createdAt)}</span>
                            </div>

                            {/* Actions Group */}
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <ApprovalActionsCell
                                    approvalId={item.id}
                                    onApprove={onApprove}
                                    onReject={onReject}
                                    isLoading={isLoading}
                                />

                                <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

                                <Button
                                    onClick={() => router.push(`/dashboard/contracts/${item.contract.id}`)}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 h-9 text-slate-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50"
                                >
                                    Review
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
