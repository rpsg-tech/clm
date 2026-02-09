'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Textarea } from '@repo/ui';
import { FileDropZone } from '@/components/contracts/file-drop-zone';

interface UploadSignedDialogProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string;
}

type SignatureStatus = 'counterparty' | 'company' | 'fully_executed';

export function UploadSignedDialog({
    isOpen,
    onClose,
    contractId,
}: UploadSignedDialogProps) {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [signatureStatus, setSignatureStatus] = useState<SignatureStatus>('fully_executed');
    const [executionNote, setExecutionNote] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = useCallback(async () => {
        if (!file) return;
        if (executionNote.length < 10) {
            showError('Validation Error', 'Execution note must be at least 10 characters');
            return;
        }

        setIsUploading(true);
        try {
            await api.contracts.uploadSigned(contractId, file);
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            success('Signed Copy Uploaded', 'The contract has been marked as active.');
            setFile(null);
            setSignatureStatus('fully_executed');
            setExecutionNote('');
            onClose();
        } catch (err) {
            showError(
                'Upload Failed',
                err instanceof Error ? err.message : 'Could not upload signed copy',
            );
        } finally {
            setIsUploading(false);
        }
    }, [file, executionNote, signatureStatus, contractId, queryClient, success, showError, onClose]);

    const headingId = useId();

    const handleClose = useCallback(() => {
        if (isUploading) return;
        setFile(null);
        setSignatureStatus('fully_executed');
        setExecutionNote('');
        onClose();
    }, [isUploading, onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />

            <div role="dialog" aria-modal="true" aria-labelledby={headingId} className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden border border-neutral-200 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-start bg-white">
                    <div className="flex flex-col gap-1">
                        <h2 id={headingId} className="text-2xl font-bold text-indigo-700 tracking-tight">Upload Signed Agreement</h2>
                        <div className="flex items-center gap-2">
                            <MaterialIcon name="description" size={18} className="text-neutral-400" />
                            <p className="text-neutral-500 text-sm font-medium">Contract ID: {contractId}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        aria-label="Close dialog"
                        className="text-neutral-400 hover:text-neutral-600 transition-colors rounded-full p-1 hover:bg-neutral-50"
                    >
                        <MaterialIcon name="close" size={24} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                    {/* Drop Zone */}
                    <FileDropZone
                        onFileSelect={setFile}
                        file={file}
                        onClear={() => setFile(null)}
                        accept=".pdf"
                        disabled={isUploading}
                    />

                    {/* Warning Banner */}
                    <div className="flex gap-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                        <MaterialIcon name="warning" size={20} className="text-amber-600 flex-shrink-0" />
                        <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-bold text-amber-800">Existing Approvals</h4>
                            <p className="text-sm text-amber-700 leading-relaxed">
                                This contract has existing approvals. Uploading a new version will flag reviewers to check changes.
                            </p>
                        </div>
                    </div>

                    {/* Signature Status Selection */}
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-4">Select Signature Status</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Signed by Counterparty */}
                            <label className="cursor-pointer group relative">
                                <input
                                    type="radio"
                                    name="signature_status"
                                    value="counterparty"
                                    checked={signatureStatus === 'counterparty'}
                                    onChange={() => setSignatureStatus('counterparty')}
                                    className="peer sr-only"
                                    disabled={isUploading}
                                />
                                <div className="h-full flex flex-col gap-3 p-5 rounded-lg border border-neutral-300 bg-white hover:border-indigo-400 peer-checked:border-indigo-600 peer-checked:ring-1 peer-checked:ring-indigo-600 peer-checked:bg-indigo-50/10 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-2 rounded-md transition-colors ${
                                            signatureStatus === 'counterparty'
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-neutral-100 text-neutral-600'
                                        }`}>
                                            <MaterialIcon name="person_edit" size={20} />
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                            signatureStatus === 'counterparty'
                                                ? 'border-indigo-600 bg-indigo-600'
                                                : 'border-neutral-300'
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full bg-white ${
                                                signatureStatus === 'counterparty' ? 'opacity-100' : 'opacity-0'
                                            }`} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${
                                            signatureStatus === 'counterparty' ? 'text-indigo-700' : 'text-neutral-900'
                                        }`}>Signed by Counterparty</p>
                                        <p className="text-xs text-neutral-500 mt-1">Pending internal signature</p>
                                    </div>
                                </div>
                            </label>

                            {/* Signed by Our Company */}
                            <label className="cursor-pointer group relative">
                                <input
                                    type="radio"
                                    name="signature_status"
                                    value="company"
                                    checked={signatureStatus === 'company'}
                                    onChange={() => setSignatureStatus('company')}
                                    className="peer sr-only"
                                    disabled={isUploading}
                                />
                                <div className="h-full flex flex-col gap-3 p-5 rounded-lg border border-neutral-300 bg-white hover:border-indigo-400 peer-checked:border-indigo-600 peer-checked:ring-1 peer-checked:ring-indigo-600 peer-checked:bg-indigo-50/10 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-2 rounded-md transition-colors ${
                                            signatureStatus === 'company'
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-neutral-100 text-neutral-600'
                                        }`}>
                                            <MaterialIcon name="domain" size={20} />
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                            signatureStatus === 'company'
                                                ? 'border-indigo-600 bg-indigo-600'
                                                : 'border-neutral-300'
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full bg-white ${
                                                signatureStatus === 'company' ? 'opacity-100' : 'opacity-0'
                                            }`} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${
                                            signatureStatus === 'company' ? 'text-indigo-700' : 'text-neutral-900'
                                        }`}>Signed by Our Company</p>
                                        <p className="text-xs text-neutral-500 mt-1">Pending counterparty</p>
                                    </div>
                                </div>
                            </label>

                            {/* Fully Executed */}
                            <label className="cursor-pointer group relative">
                                <input
                                    type="radio"
                                    name="signature_status"
                                    value="fully_executed"
                                    checked={signatureStatus === 'fully_executed'}
                                    onChange={() => setSignatureStatus('fully_executed')}
                                    className="peer sr-only"
                                    disabled={isUploading}
                                />
                                <div className="h-full flex flex-col gap-3 p-5 rounded-lg border border-neutral-300 bg-white hover:border-indigo-400 peer-checked:border-indigo-600 peer-checked:ring-1 peer-checked:ring-indigo-600 peer-checked:bg-indigo-50/30 transition-all shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-2 rounded-md transition-colors shadow-sm ${
                                            signatureStatus === 'fully_executed'
                                                ? 'bg-indigo-700 text-white'
                                                : 'bg-neutral-100 text-neutral-600'
                                        }`}>
                                            <MaterialIcon name="verified" size={20} />
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                            signatureStatus === 'fully_executed'
                                                ? 'border-indigo-600 bg-indigo-600'
                                                : 'border-neutral-300'
                                        }`}>
                                            {signatureStatus === 'fully_executed' ? (
                                                <MaterialIcon name="check" size={14} className="text-white" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-white opacity-0" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${
                                            signatureStatus === 'fully_executed' ? 'text-indigo-700' : 'text-neutral-900'
                                        }`}>Fully Executed</p>
                                        <p className={`text-xs mt-1 ${
                                            signatureStatus === 'fully_executed' ? 'text-indigo-700/80' : 'text-neutral-500'
                                        }`}>All parties have signed</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Execution Note */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-semibold text-neutral-900" htmlFor="execution-note">
                                Execution Note <span className="text-red-500">*</span>
                            </label>
                            <span className="text-xs text-neutral-400">Min 10 characters</span>
                        </div>
                        <div className="relative">
                            <Textarea
                                id="execution-note"
                                placeholder="Please provide details about the execution context..."
                                value={executionNote}
                                onChange={(e) => setExecutionNote(e.target.value)}
                                rows={4}
                                disabled={isUploading}
                                className="w-full resize-none"
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-neutral-400 bg-white px-1 rounded pointer-events-none">
                                {executionNote.length}/500 (Min 10)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="px-6 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-semibold text-sm hover:bg-white hover:text-neutral-900 hover:shadow-sm transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || executionNote.length < 10 || isUploading}
                        className="px-6 py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <MaterialIcon name="sync" size={18} className="animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <MaterialIcon name="check_circle" size={18} />
                                Upload &amp; Save
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
