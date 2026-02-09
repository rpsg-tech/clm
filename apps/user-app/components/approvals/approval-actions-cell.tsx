import { Button } from '@repo/ui';
import { CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ApprovalActionsCellProps {
    approvalId: string;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isLoading: boolean;
}

export function ApprovalActionsCell({ approvalId, onApprove, onReject, isLoading }: ApprovalActionsCellProps) {
    return (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full"
                onClick={(e) => {
                    e.stopPropagation();
                    onApprove(approvalId);
                }}
                disabled={isLoading}
                title="Quick Approve"
            >
                <CheckCircle className="w-4 h-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                onClick={(e) => {
                    e.stopPropagation();
                    onReject(approvalId);
                }}
                disabled={isLoading}
                title="Quick Reject"
            >
                <XCircle className="w-4 h-4" />
            </Button>
        </div>
    );
}
