import React from "react";
import { Button, Textarea } from "@repo/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Edit } from "lucide-react";

interface RevisionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (comment: string) => void;
}

export function RevisionDialog({ open, onOpenChange, onConfirm }: RevisionDialogProps) {
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
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <Edit className="w-5 h-5" />
                        Request Changes
                    </DialogTitle>
                    <DialogDescription>
                        Specify the changes required. The contract will be returned to Draft state for the creator to edit.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="Describe the changes needed..."
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
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        Request Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
