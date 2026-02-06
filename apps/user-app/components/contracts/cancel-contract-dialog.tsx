'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Textarea } from '@repo/ui';

interface CancelContractDialogProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string;
    contractTitle: string;
}

export function CancelContractDialog({
    isOpen,
    onClose,
    contractId,
    contractTitle,
}: CancelContractDialogProps) {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCancel = useCallback(async () => {
        if (reason.length < 10) return;

        setIsSubmitting(true);
        try {
            await api.contracts.cancel(contractId, reason);
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            success('Contract Cancelled', 'The contract has been cancelled.');
            setReason('');
            onClose();
        } catch (err) {
            showError(
                'Cancellation Failed',
                err instanceof Error ? err.message : 'Could not cancel contract',
            );
        } finally {
            setIsSubmitting(false);
        }
    }, [reason, contractId, queryClient, success, showError, onClose]);

    const handleClose = useCallback(() => {
        if (isSubmitting) return;
        setReason('');
        onClose();
    }, [isSubmitting, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <MaterialIcon name="cancel" size={20} className="text-red-600" />
                        <h2 className="text-base font-semibold text-slate-900">
                            Cancel Contract
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <MaterialIcon name="close" size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2.5">
                        <MaterialIcon name="warning" size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                            This cannot be undone. <span className="font-medium">&lsquo;{contractTitle}&rsquo;</span> will be permanently cancelled.
                        </p>
                    </div>

                    <label className="block">
                        <span className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Reason for cancellation <span className="text-red-500">*</span>
                        </span>
                        <Textarea
                            placeholder="Explain why this contract is being cancelled..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Minimum 10 characters ({reason.length}/10)
                        </p>
                    </label>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        Keep Contract
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={reason.length < 10 || isSubmitting}
                        className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                        {isSubmitting ? (
                            <>
                                <MaterialIcon name="sync" size={16} className="animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            <>
                                <MaterialIcon name="cancel" size={16} />
                                Cancel Contract
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
