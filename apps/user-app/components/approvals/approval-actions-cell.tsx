import { Button, Textarea } from '@repo/ui';
import { CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface ApprovalActionsCellProps {
    approvalId: string;
    onApprove: (id: string, comment?: string) => Promise<void> | void;
    onReject: (id: string, comment: string) => Promise<void> | void;
    isLoading: boolean;
}

export function ApprovalActionsCell({ approvalId, onApprove, onReject, isLoading }: ApprovalActionsCellProps) {
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [comment, setComment] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            await onApprove(approvalId, comment);
            setShowApproveDialog(false);
            setComment("");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        try {
            setActionLoading(true);
            await onReject(approvalId, comment);
            setShowRejectDialog(false);
            setComment("");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setComment("");
                        setShowApproveDialog(true);
                    }}
                    disabled={isLoading || actionLoading}
                    title="Quick Approve"
                >
                    <CheckCircle className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setComment("");
                        setShowRejectDialog(true);
                    }}
                    disabled={isLoading || actionLoading}
                    title="Quick Reject"
                >
                    <XCircle className="w-4 h-4" />
                </Button>
            </div>

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle className="w-5 h-5" />
                            Approve Contract
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this contract? You can add an optional comment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder="Add approval notes (optional)..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {actionLoading ? "Approving..." : "Confirm Approval"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <XCircle className="w-5 h-5" />
                            Reject Contract
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this contract. This will be sent to the requester.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder="Reason for rejection (required)..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={!comment.trim() || actionLoading}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
