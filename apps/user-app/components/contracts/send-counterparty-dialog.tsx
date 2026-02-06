'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Textarea } from '@repo/ui';

interface SendCounterpartyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string;
    counterpartyName: string | null;
    counterpartyEmail: string | null;
}

export function SendCounterpartyDialog({
    isOpen,
    onClose,
    contractId,
    counterpartyName,
    counterpartyEmail,
}: SendCounterpartyDialogProps) {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const canSend = !!counterpartyEmail;

    const handleSend = useCallback(async () => {
        if (!canSend) return;

        setIsSending(true);
        try {
            await api.contracts.send(contractId);
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            success('Contract Sent', 'The contract has been sent to the counterparty.');
            setMessage('');
            onClose();
        } catch (err) {
            showError(
                'Send Failed',
                err instanceof Error ? err.message : 'Could not send contract',
            );
        } finally {
            setIsSending(false);
        }
    }, [canSend, contractId, queryClient, success, showError, onClose]);

    const handleClose = useCallback(() => {
        if (isSending) return;
        setMessage('');
        onClose();
    }, [isSending, onClose]);

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
                        <MaterialIcon name="send" size={20} className="text-indigo-600" />
                        <h2 className="text-base font-semibold text-slate-900">
                            Send to Counterparty
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSending}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <MaterialIcon name="close" size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Counterparty</p>
                            <p className="text-sm font-medium text-slate-900">{counterpartyName || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Email</p>
                            <p className="text-sm text-slate-900">{counterpartyEmail || '—'}</p>
                        </div>
                    </div>

                    {!canSend && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2.5">
                            <MaterialIcon name="warning" size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                No counterparty email is set. Please update the contract details before sending.
                            </p>
                        </div>
                    )}

                    <label className="block">
                        <span className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Message (optional)
                        </span>
                        <Textarea
                            placeholder="Add a note to include with the contract..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={2}
                            disabled={isSending}
                        />
                    </label>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                    <button
                        onClick={handleClose}
                        disabled={isSending}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!canSend || isSending}
                        className="inline-flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                        {isSending ? (
                            <>
                                <MaterialIcon name="sync" size={16} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <MaterialIcon name="send" size={16} />
                                Send Contract
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
