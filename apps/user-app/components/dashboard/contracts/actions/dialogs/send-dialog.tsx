import React from "react";
import { Button, Textarea, Spinner } from "@repo/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Send } from "lucide-react";

interface SendDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (recipients: string[]) => void;
    initialEmails?: string;
    loading?: boolean;
}

export function SendDialog({ open, onOpenChange, onConfirm, initialEmails = "", loading = false }: SendDialogProps) {
    const [emails, setEmails] = React.useState(initialEmails);

    React.useEffect(() => {
        if (open) setEmails(initialEmails || "");
    }, [open, initialEmails]);

    const handleConfirm = () => {
        const recipientList = emails
            .split(',')
            .map(e => e.trim())
            .filter(e => e.length > 0);

        if (recipientList.length === 0) return;
        onConfirm(recipientList);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-800">
                        <Send className="w-5 h-5 text-indigo-600" />
                        Send Contract for Signing
                    </DialogTitle>
                    <DialogDescription>
                        Enter the email addresses of the recipients who need to sign this contract.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Recipient Email(s)</label>
                        <Textarea
                            placeholder="e.g. signer@company.com, legal@company.com"
                            value={emails}
                            onChange={(e) => setEmails(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                        <p className="text-xs text-slate-500">
                            Separate multiple email addresses with commas.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!emails.trim() || loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
                    >
                        {loading ? <Spinner size="sm" className="text-white" /> : 'Send Email'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
