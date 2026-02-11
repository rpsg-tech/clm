'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button, Textarea } from '@repo/ui';

import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowUpCircle } from 'lucide-react';

interface EscalateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contractId: string;
    contractTitle: string;
    onEscalate: (reason?: string) => Promise<void>;
}

export function EscalateDialog({
    open,
    onOpenChange,
    contractId,
    contractTitle,
    onEscalate,
}: EscalateDialogProps) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEscalate = async () => {
        setLoading(true);
        try {
            await onEscalate(reason || undefined);
            setReason('');
            onOpenChange(false);
        } catch (error) {
            // Error handling is done in parent component
            console.error('Escalation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowUpCircle className="h-5 w-5 text-orange-600" />
                        Escalate to Legal Head
                    </DialogTitle>
                    <DialogDescription>
                        Escalate <strong>{contractTitle}</strong> to Legal Head for final approval.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                            <p className="font-medium mb-1">Before escalating:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                                <li>Ensure you've completed your review</li>
                                <li>Legal Head will be notified immediately</li>
                                <li>This action cannot be undone</li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Reason for Escalation <span className="text-muted-foreground">(Optional)</span>
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g., Complex contract requiring Legal Head approval, high-value deal, special terms..."
                            value={reason}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Provide context to help Legal Head understand why this requires their attention.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setReason('');
                            onOpenChange(false);
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEscalate}
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                    >
                        {loading ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Escalating...
                            </>
                        ) : (
                            <>
                                <ArrowUpCircle className="h-4 w-4 mr-2" />
                                Escalate to Legal Head
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
