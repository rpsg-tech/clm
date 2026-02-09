'use client';

import { useState } from 'react';
import { ApprovalQueue } from '@/components/contracts/approval-queue';
import { ReviewWorkbench } from '@/components/contracts/review-workbench';

import type { Approval, Contract } from '@repo/types';

type ApprovalWithContract = Approval & {
    contract?: Pick<Contract, 'title' | 'counterpartyName' | 'reference' | 'status'>;
};

export default function LegalReviewPage() {
    const [selectedApproval, setSelectedApproval] = useState<ApprovalWithContract | null>(null);

    const contractId = selectedApproval?.contractId ?? '';

    return (
        <div className="-m-8 flex h-[calc(100vh-4rem)]">
            {/* Left: Approval Queue */}
            <div className="w-80 2xl:w-96 bg-white border-r border-neutral-200 flex-shrink-0">
                <ApprovalQueue
                    type="LEGAL"
                    selectedId={selectedApproval?.id ?? null}
                    onSelect={setSelectedApproval}
                />
            </div>

            {/* Center: Review Workbench */}
            <div className="flex-1 min-w-0">
                <ReviewWorkbench
                    approval={selectedApproval}
                    canEdit={true}
                    reviewerRole="legal"
                    onAction={() => setSelectedApproval(null)}
                />
            </div>


        </div>
    );
}
