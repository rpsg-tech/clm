'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { MaterialIcon } from '@/components/ui/material-icon';
import { FileDropZone } from '@/components/contracts/file-drop-zone';

interface UploadSignedDialogProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string;
}

export function UploadSignedDialog({
    isOpen,
    onClose,
    contractId,
}: UploadSignedDialogProps) {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = useCallback(async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            await api.contracts.uploadSigned(contractId, file);
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            success('Signed Copy Uploaded', 'The contract has been marked as active.');
            setFile(null);
            onClose();
        } catch (err) {
            showError(
                'Upload Failed',
                err instanceof Error ? err.message : 'Could not upload signed copy',
            );
        } finally {
            setIsUploading(false);
        }
    }, [file, contractId, queryClient, success, showError, onClose]);

    const handleClose = useCallback(() => {
        if (isUploading) return;
        setFile(null);
        onClose();
    }, [isUploading, onClose]);

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
                        <MaterialIcon name="upload_file" size={20} className="text-indigo-600" />
                        <h2 className="text-base font-semibold text-slate-900">
                            Upload Signed Copy
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <MaterialIcon name="close" size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <FileDropZone
                        onFileSelect={setFile}
                        file={file}
                        onClear={() => setFile(null)}
                        accept=".pdf"
                        compact
                        disabled={isUploading}
                    />

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex gap-2.5">
                        <MaterialIcon name="info" size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            Upload the countersigned PDF. This will mark the contract as active.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="inline-flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                        {isUploading ? (
                            <>
                                <MaterialIcon name="sync" size={16} className="animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <MaterialIcon name="upload" size={16} />
                                Upload Signed Copy
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
