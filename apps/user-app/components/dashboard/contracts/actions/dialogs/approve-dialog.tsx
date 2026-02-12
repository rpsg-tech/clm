import { Button, Textarea } from "@repo/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface ApproveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (comment: string) => void;
    type: 'LEGAL' | 'FINANCE' | null;
}

export function ApproveDialog({ open, onOpenChange, onConfirm, type }: ApproveDialogProps) {
    const [comment, setComment] = React.useState("");

    // Reset comment when dialog opens
    React.useEffect(() => {
        if (open) setComment("");
    }, [open]);

    // Handle Confirm
    const handleConfirm = () => {
        onConfirm(comment);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        Approve Contract ({type})
                    </DialogTitle>
                    <DialogDescription>
                        Approve this contract for {type === 'LEGAL' ? 'legal compliance' : 'financial review'}. You may add optional comments.
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Approval
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import React from "react";
