'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Badge, Spinner } from '@repo/ui';
import { MaterialIcon } from '@/components/ui/material-icon';
import { ContractEditorView, ContractEditorRef } from '@/components/contract-editor-view';
import { api } from '@/lib/api-client';
import { ApprovalItem } from './approval-queue-list';

interface ReviewWorkbenchProps {
    approval: ApprovalItem | null;
    onApprove: (comment: string) => Promise<void>;
    onReject: (comment: string) => Promise<void>;
    isActionLoading: boolean;
    role?: 'LEGAL' | 'FINANCE';
}

export const ReviewWorkbench: React.FC<ReviewWorkbenchProps> = ({
    approval,
    onApprove,
    onReject,
    isActionLoading,
    role = 'LEGAL'
}) => {
    const [activeTab, setActiveTab] = useState<'EDITOR' | 'DIFF' | 'CONTEXT'>('EDITOR');
    const [contract, setContract] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Modal States
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [comment, setComment] = useState('');

    const editorRef = useRef<ContractEditorRef>(null);

    useEffect(() => {
        if (approval) {
            fetchContractDetails(approval.contract.id);
            setActiveTab('EDITOR');
        } else {
            setContract(null);
        }
    }, [approval]);

    const fetchContractDetails = async (id: string) => {
        setIsLoading(true);
        try {
            const data = await api.contracts.get(id);
            setContract(data);
        } catch (error) {
            console.error("Failed to load contract", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveClick = () => {
        setComment('');
        setShowApproveModal(true);
    };

    const handleRejectClick = () => {
        setComment('');
        setShowRejectModal(true);
    };

    const executeApprove = async () => {
        await onApprove(comment);
        setShowApproveModal(false);
    };

    const executeReject = async () => {
        await onReject(comment);
        setShowRejectModal(false);
    };

    if (!approval) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50/50">
                <div className="text-center p-8 opacity-50">
                    <MaterialIcon name="pending_actions" className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Select a request to review</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <div className="h-full flex items-center justify-center"><Spinner size="md" /></div>;
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`font-mono text-[10px] uppercase ${role === 'FINANCE' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-indigo-600 border-indigo-200 bg-indigo-50'}`}>
                            {role} REVIEW
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{approval.contract.reference}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">{approval.contract.title}</h2>
                </div>

                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    {['EDITOR', 'DIFF', 'CONTEXT'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative bg-slate-50/30">
                {activeTab === 'EDITOR' && (
                    <div className="h-full flex flex-col">
                        {contract?.content ? (
                            <ContractEditorView
                                ref={editorRef}
                                content={contract.content}
                                onChange={() => { }}
                                readOnly={true}
                                className="h-full border-none"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">No content available</div>
                        )}
                    </div>
                )}

                {activeTab === 'DIFF' && (
                    <div className="p-8 max-w-3xl mx-auto">
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-center">
                            <MaterialIcon name="difference" className="w-8 h-8 text-indigo-200 mx-auto mb-3" />
                            <h3 className="text-sm font-bold text-slate-900 mb-1">No Previous Version</h3>
                            <p className="text-xs text-slate-500">This is the first version of the contract. No changes to compare.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'CONTEXT' && (
                    <div className="p-8 max-w-3xl mx-auto space-y-6">
                        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Request Context</h3>
                            <dl className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div>
                                    <dt className="text-slate-500 text-xs mb-1">Submitted By</dt>
                                    <dd className="font-medium text-slate-900">{approval.contract.createdByUser.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500 text-xs mb-1">Submitted On</dt>
                                    <dd className="font-medium text-slate-900">{new Date(approval.createdAt).toLocaleDateString()}</dd>
                                </div>
                                <div className="col-span-2">
                                    <dt className="text-slate-500 text-xs mb-1">Template Used</dt>
                                    <dd className="font-medium text-slate-900">{contract?.template?.name || 'Standard Agreement'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={handleRejectClick}
                    disabled={isActionLoading}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold uppercase text-[10px] tracking-wider"
                >
                    Reject
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="font-bold uppercase text-[10px] tracking-wider text-slate-600">
                        Ask Question
                    </Button>
                    <Button
                        onClick={handleApproveClick}
                        disabled={isActionLoading}
                        className="bg-slate-900 text-white hover:bg-emerald-600 font-bold uppercase text-[10px] tracking-wider shadow-md transition-colors"
                    >
                        {role === 'FINANCE' ? 'Finance Approve' : 'Legal Approve'}
                    </Button>
                </div>
            </div>

            {/* Modals */}
            {showApproveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <MaterialIcon name="check_circle" className="text-emerald-600" />
                            Confirm Approval
                        </h3>
                        <textarea
                            className="w-full p-3 border border-slate-300 rounded-md text-sm mb-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Optional comments..."
                            rows={3}
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowApproveModal(false)} disabled={isActionLoading}>Cancel</Button>
                            <Button onClick={executeApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isActionLoading}>
                                {isActionLoading ? 'Approving...' : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <MaterialIcon name="cancel" className="text-rose-600" />
                            Reject Request
                        </h3>
                        <p className="text-sm text-slate-500 mb-2">Please provide a reason for rejection.</p>
                        <textarea
                            className="w-full p-3 border border-slate-300 rounded-md text-sm mb-4 focus:ring-2 focus:ring-rose-500 outline-none"
                            placeholder="Reason required..."
                            rows={3}
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowRejectModal(false)} disabled={isActionLoading}>Cancel</Button>
                            <Button
                                onClick={executeReject}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                                disabled={isActionLoading || !comment.trim()}
                            >
                                {isActionLoading ? 'Rejecting...' : 'Reject'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
