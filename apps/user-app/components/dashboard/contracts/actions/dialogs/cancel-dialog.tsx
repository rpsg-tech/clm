import React from "react";
import { Button, Textarea } from "@repo/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Ban, AlertTriangle } from "lucide-react";

interface CancelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
}

export function CancelDialog({ open, onOpenChange, onConfirm }: CancelDialogProps) {
    const [reason, setReason] = React.useState("");

    React.useEffect(() => {
        if (open) setReason("");
    }, [open]);

    const handleConfirm = () => {
        onConfirm(reason);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Ban className="w-5 h-5" /> {/* Or AlertTriangle */}
                        Cancel Contract
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel this contract? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="Reason for cancellation (required)..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="resize-none"
                        rows={3}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Keep Contract
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!reason.trim()}
                    >
                        Confirm Cancellation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
