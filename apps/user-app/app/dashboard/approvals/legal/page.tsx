'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Skeleton } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { CheckCircle, XCircle, Clock, FileText, ChevronRight, User, AlertCircle, ArrowRight } from 'lucide-react';

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
    const { hasPermission } = useAuth();
    const canAct = hasPermission('approval:legal:act');

    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchApprovals();
    }, []);

    // Effect to handle URL parameters for deep linking
    useEffect(() => {
        if (!isLoading && approvals.length > 0) {
            const contractId = searchParams.get('id');
            const action = searchParams.get('action');

            if (contractId) {
                // Find approval matching the contract ID
                const target = approvals.find(a => a.contract.id === contractId);
                if (target) {
                    setSelectedId(target.id);
                    // Open modal if action is specified
                    if (action === 'approve') {
                        setShowApproveModal(true);
                    } else if (action === 'reject') {
                        setShowRejectModal(true);
                    }
                }
            }
        }
    }, [isLoading, approvals, searchParams]);

    const fetchApprovals = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.approvals.pending('LEGAL');
            const pendingApprovals = data as Approval[];
            setApprovals(pendingApprovals);

            // Auto-select first if no URL param
            if (pendingApprovals.length > 0 && !selectedId && !searchParams.get('id')) {
                setSelectedId(pendingApprovals[0].id);
            }
        } catch (error: any) {
            console.error('Failed to fetch approvals:', error);
            setError(error?.message || 'Failed to load approvals.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = () => {
        if (!selectedId) return;
        setShowApproveModal(true);
    };

    const confirmApprove = async () => {
        if (!selectedId) return;
        setActionLoading(selectedId);
        setError(null);

        try {
            await api.approvals.approve(selectedId, comment);
            setComment('');
            setShowApproveModal(false);

            // Remove from list
            const updated = approvals.filter(a => a.id !== selectedId);
            setApprovals(updated);

            // Select next available
            if (updated.length > 0) {
                setSelectedId(updated[0].id);
            } else {
                setSelectedId(null);
            }
        } catch (error: any) {
            console.error('Failed to approve:', error);
            setError('Failed to approve. ' + (error?.message || ''));
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!selectedId || !comment.trim()) return;
        setActionLoading(selectedId);

        try {
            await api.approvals.reject(selectedId, comment);
            setShowRejectModal(false);
            setComment('');

            // Remove from list
            const updated = approvals.filter(a => a.id !== selectedId);
            setApprovals(updated);

            // Select next available
            if (updated.length > 0) {
                setSelectedId(updated[0].id);
            } else {
                setSelectedId(null);
            }
        } catch (error: any) {
            console.error('Failed to reject:', error);
            setError('Failed to reject. ' + (error?.message || ''));
        } finally {
            setActionLoading(null);
        }
    };

    const selectedApproval = approvals.find(a => a.id === selectedId);

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

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6 h-[calc(100vh-100px)] px-6">
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-full w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (approvals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center px-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-80px)] p-6 overflow-hidden">
            {/* Left Column: List */}
            <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
                <div className="mb-4 pr-2 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Legal Review</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{approvals.length} PENDING ITEMS</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-2">
                    {approvals.map((approval) => (
                        <div
                            key={approval.id}
                            onClick={() => setSelectedId(approval.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group relative overflow-hidden ${selectedId === approval.id
                                ? 'bg-orange-600 border-orange-600 shadow-md'
                                : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <h3 className={`font-bold text-sm line-clamp-2 leading-snug ${selectedId === approval.id ? 'text-white' : 'text-slate-900'
                                    }`}>
                                    {approval.contract.title}
                                </h3>
                            </div>

                            <div className="space-y-1.5 relative z-10">
                                <div className={`flex items-center text-[10px] font-bold ${selectedId === approval.id ? 'text-orange-100' : 'text-slate-500'}`}>
                                    <User className="w-3 h-3 mr-1.5 opacity-70" />
                                    {approval.contract.createdByUser.name}
                                </div>
                                <div className={`flex items-center text-[10px] font-medium ${selectedId === approval.id ? 'text-orange-100' : 'text-slate-400'}`}>
                                    <Clock className="w-3 h-3 mr-1.5 opacity-70" />
                                    {timeSince(approval.createdAt)} • <span className="font-mono ml-1 opacity-70">{approval.contract.reference}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Detail Pane */}
            <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm relative">
                {selectedApproval ? (
                    <>
                        {/* Detail Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Badge className="bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide">
                                        Review Required
                                    </Badge>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Ref: {selectedApproval.contract.reference}</span>
                                </div>

                                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{selectedApproval.contract.title}</h2>
                                <p className="text-xs font-medium text-slate-500 pt-1">
                                    Submitted by <span className="text-slate-900 font-bold">{selectedApproval.contract.createdByUser.name}</span>
                                </p>
                            </div>
                            <Link href={`/dashboard/contracts/${selectedApproval.contract.id}`} target="_blank">
                                <Button variant="ghost" size="sm" className="gap-1.5 bg-white border border-slate-200 shadow-sm hover:border-orange-300 rounded-lg text-slate-600 hover:text-orange-600 font-bold text-[10px] uppercase tracking-wide h-8 px-3">
                                    Full Contract
                                    <ArrowRight className="w-3 h-3" />
                                </Button>
                            </Link>
                        </div>

                        {/* Detail Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="max-w-3xl mx-auto space-y-6">
                                <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 flex gap-3">
                                    <div className="mt-0.5">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wide mb-1">Attention Required</h4>
                                        <p className="text-amber-800/90 text-sm font-medium leading-relaxed">
                                            This contract requires legal verification. Please review all indemnification clauses and liability caps before proceeding.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                                        Document Preview
                                    </h3>

                                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
                                        <div className="space-y-4 relative z-10 opacity-60">
                                            <div className="h-3 bg-slate-200 rounded-full w-3/4"></div>
                                            <div className="h-3 bg-slate-200 rounded-full w-full"></div>
                                            <div className="h-3 bg-slate-200 rounded-full w-5/6"></div>
                                            <div className="h-3 bg-slate-200 rounded-full w-4/5"></div>
                                            <div className="h-3 bg-slate-200 rounded-full w-3/4"></div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                                            <Link href={`/dashboard/contracts/${selectedApproval.contract.id}`} target="_blank">
                                                <Button className="bg-slate-900 text-white rounded-lg shadow-lg hover:scale-105 transition-all font-bold text-xs h-9">
                                                    Open Document Viewer
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
                            <Button
                                variant="ghost"
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold uppercase text-[10px] tracking-wider h-10 px-6 rounded-lg"
                                onClick={() => setShowRejectModal(true)}
                                disabled={!!actionLoading}
                            >
                                Reject
                            </Button>

                            <div className="flex-1 flex justify-end">
                                <Button
                                    className="bg-slate-900 hover:bg-orange-600 text-white h-10 px-8 rounded-lg shadow-sm hover:shadow-orange-600/20 font-bold uppercase text-[10px] tracking-wider transition-all"
                                    onClick={handleApprove}
                                    disabled={!!actionLoading}
                                >
                                    {actionLoading === selectedId ? 'Processing...' : (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5 mr-2" />
                                            Approve Contract
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <ArrowRight className="w-6 h-6 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Select an Item</h3>
                            <p className="text-slate-500 font-medium text-xs mt-1">Choose a contract from the list to review.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                                <XCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reject Contract</h2>
                            <p className="text-slate-500 font-medium text-sm mt-1">
                                This will return the contract to draft. Please provide a reason.
                            </p>
                        </div>

                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Reason for rejection (required)..."
                            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 min-h-[100px] text-sm font-medium mb-6 resize-none placeholder-slate-400"
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                className="flex-1 rounded-lg h-10 font-bold uppercase text-[10px] tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-10 font-bold uppercase text-[10px] tracking-wider shadow-sm"
                                disabled={!comment.trim() || !!actionLoading}
                                onClick={handleReject}
                            >
                                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Confirm Approval</h2>
                            <p className="text-slate-500 font-medium text-sm mt-1">
                                You are about to digitally sign-off on this agreement.
                            </p>
                        </div>

                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Optional approval notes..."
                            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 min-h-[100px] text-sm font-medium mb-6 resize-none placeholder-slate-400"
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                className="flex-1 rounded-lg h-10 font-bold uppercase text-[10px] tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                onClick={() => setShowApproveModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-10 font-bold uppercase text-[10px] tracking-wider shadow-sm"
                                disabled={!!actionLoading}
                                onClick={confirmApprove}
                            >
                                {actionLoading ? 'Processing...' : 'Approve'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
