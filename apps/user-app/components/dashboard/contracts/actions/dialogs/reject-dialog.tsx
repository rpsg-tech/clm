import React from "react";
import { Button, Textarea } from "@repo/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { XCircle } from "lucide-react";

interface RejectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (comment: string) => void;
    type: 'LEGAL' | 'FINANCE' | 'RETURN_TO_MANAGER' | null;
}

export function RejectDialog({ open, onOpenChange, onConfirm, type }: RejectDialogProps) {
    const [comment, setComment] = React.useState("");

    React.useEffect(() => {
        if (open) setComment("");
    }, [open]);

    const handleConfirm = () => {
        onConfirm(comment);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        {type === 'RETURN_TO_MANAGER' ? 'Return to Manager' : `Reject Contract (${type})`}
                    </DialogTitle>
                    <DialogDescription>
                        {type === 'RETURN_TO_MANAGER'
                            ? 'Send this contract back to the Legal Manager for review. Please provide instructions.'
                            : 'Reject this contract and explain the reason. The contract creator will be notified.'}
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!comment.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
