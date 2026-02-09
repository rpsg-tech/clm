'use client';

import { useState } from 'react';
import { ApprovalQueue } from '@/components/contracts/approval-queue';
import { ReviewWorkbench } from '@/components/contracts/review-workbench';

import { MaterialIcon } from '@/components/ui/material-icon';
import type { Approval, Contract } from '@repo/types';



type ApprovalWithContract = Approval & {
    contract?: Pick<Contract, 'title' | 'counterpartyName' | 'reference' | 'status'>;
};

function FinancialSummaryContent() {
    return (
        <div className="flex-1 overflow-y-auto">
            {/* Contract Value Card */}
            <div className="p-4">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                    Total Contract Value
                </p>
                <p className="text-2xl font-bold text-neutral-900 tabular-nums mt-1">
                    ₹ 1,20,00,000
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">Annual recurring</p>
            </div>

            {/* Key Financial Terms */}
            <div className="p-4 border-t border-neutral-200">
                <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">
                    Key Financial Terms
                </h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Payment Terms</span>
                        <span className="text-sm font-semibold text-neutral-900">Net 60</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Currency</span>
                        <span className="text-sm font-semibold text-neutral-900">INR (₹)</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Billing Cycle</span>
                        <span className="text-sm font-semibold text-neutral-900">Quarterly</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Auto-Renewal</span>
                        <span className="text-sm font-semibold text-neutral-900">Yes</span>
                    </div>
                </div>
            </div>

            {/* Budget Allocation */}
            <div className="p-4 border-t border-neutral-200">
                <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">
                    Budget Allocation
                </h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Budget Code</span>
                        <span className="text-sm font-semibold text-neutral-900">FIN-2026-Q1-OPS</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Department</span>
                        <span className="text-sm font-semibold text-neutral-900">Operations</span>
                    </div>
                    <div className="mt-3">
                        <div className="w-full h-2 bg-neutral-100 rounded-full">
                            <div
                                className="h-2 bg-indigo-600 rounded-full"
                                style={{ width: '65%' }}
                            />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1.5">
                            65% of quarterly budget allocated
                        </p>
                    </div>
                </div>
            </div>

            {/* Risk Flags */}
            <div className="p-4 border-t border-neutral-200">
                <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">
                    Risk Flags
                </h4>
                <div className="space-y-2.5">
                    <div className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
                        <span className="text-xs text-neutral-700 leading-relaxed">
                            Payment terms deviate from standard Net 30
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                        <span className="text-xs text-neutral-700 leading-relaxed">
                            Contract value within approval threshold
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                        <span className="text-xs text-neutral-700 leading-relaxed">
                            Late payment penalty exceeds company policy
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FinanceReviewPage() {
    const [selectedApproval, setSelectedApproval] = useState<ApprovalWithContract | null>(null);


    const contractId = selectedApproval?.contractId ?? '';

    return (
        <div className="-m-8 flex h-[calc(100vh-4rem)]">
            {/* Left: Approval Queue */}
            <div className="w-80 2xl:w-96 bg-white border-r border-neutral-200 flex-shrink-0">
                <ApprovalQueue
                    type="FINANCE"
                    selectedId={selectedApproval?.id ?? null}
                    onSelect={setSelectedApproval}
                />
            </div>

            {/* Center: Review Workbench */}
            <div className="flex-1 min-w-0">
                <ReviewWorkbench
                    approval={selectedApproval}
                    canEdit={false}
                    reviewerRole="finance"
                    onAction={() => setSelectedApproval(null)}
                />
            </div>

            {/* Right: Finance Summary Panel */}
            <div className="w-80 bg-white border-l border-neutral-200 flex-shrink-0 flex flex-col">
                {selectedApproval ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex-shrink-0">
                            <MaterialIcon name="account_balance" size={18} className="text-neutral-600" />
                            <h3 className="text-sm font-semibold text-neutral-800">
                                Financial Overview
                            </h3>
                        </div>
                        <FinancialSummaryContent />
                    </>
                ) : (
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center px-6">
                        <MaterialIcon name="account_balance" size={32} className="text-neutral-300" />
                        <p className="text-sm text-neutral-400 mt-3 text-center">
                            Select a contract to view financial details
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
