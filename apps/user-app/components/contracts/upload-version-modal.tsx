'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Textarea } from '@repo/ui';
import { FileDropZone } from '@/components/contracts/file-drop-zone';
import type { Contract } from '@repo/types';

interface UploadVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string;
    onSuccess: () => void;
    contract?: Contract & {
        template?: string;
        counterparty?: string;
        value?: number | string;
        currentVersion?: string;
    };
}

export function UploadVersionModal({
    isOpen,
    onClose,
    contractId,
    onSuccess,
    contract,
}: UploadVersionModalProps) {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [uploadType, setUploadType] = useState<'revised' | 'counterparty'>('revised');
    const [changeNotes, setChangeNotes] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = useCallback(async () => {
        if (!file) return;
        if (changeNotes.length < 10) {
            showError('Validation Error', 'Change notes must be at least 10 characters');
            return;
        }

        setIsUploading(true);
        try {
            const { uploadUrl, key } = await api.contracts.getDocumentUploadUrl(
                contractId,
                file.name,
                file.type || 'application/octet-stream'
            );

            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type || 'application/octet-stream' },
            });

            await api.contracts.confirmDocumentUpload(contractId, key, file.name, file.size);

            queryClient.invalidateQueries({ queryKey: ['contract-versions', contractId] });
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] });

            success('Version Uploaded', 'New document version has been uploaded.');
            setFile(null);
            setUploadType('revised');
            setChangeNotes('');
            onSuccess();
            onClose();
        } catch (err) {
            showError(
                'Upload Failed',
                err instanceof Error ? err.message : 'Could not upload file'
            );
        } finally {
            setIsUploading(false);
        }
    }, [file, changeNotes, contractId, queryClient, success, showError, onSuccess, onClose]);

    const headingId = useId();

    const handleClose = useCallback(() => {
        if (isUploading) return;
        setFile(null);
        setUploadType('revised');
        setChangeNotes('');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div role="dialog" aria-modal="true" aria-labelledby={headingId} className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden border border-neutral-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                        <MaterialIcon name="upload_file" size={20} className="text-indigo-600" />
                        <h2 id={headingId} className="text-base font-semibold text-neutral-900">
                            Upload New Version
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        aria-label="Close dialog"
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <MaterialIcon name="close" size={18} />
                    </button>
                </div>

                {/* Contract Context Header (if contract available) */}
                {contract && (
                    <div className="px-6 py-4 border-b border-neutral-200">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                <MaterialIcon name="schedule_send" size={14} />
                                {contract.status || 'In Progress'}
                            </span>
                            {contract.template && (
                                <span className="text-xs text-neutral-500 font-medium bg-neutral-100 px-2 py-0.5 rounded uppercase tracking-wide">
                                    Template: {contract.template}
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900">{contract.title}</h3>
                        <p className="text-sm text-neutral-500 mt-1">
                            {contract.counterparty} • {contract.value} • Current: {contract.currentVersion || 'v1.0'}
                        </p>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 space-y-6">
                    <FileDropZone
                        onFileSelect={setFile}
                        file={file}
                        onClear={() => setFile(null)}
                        disabled={isUploading}
                    />

                    {/* Upload Type Selection */}
                    <div>
                        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <MaterialIcon name="category" size={18} className="text-neutral-400" />
                            What are you uploading?
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="relative flex cursor-pointer">
                                <input
                                    type="radio"
                                    name="upload_type"
                                    value="revised"
                                    checked={uploadType === 'revised'}
                                    onChange={() => setUploadType('revised')}
                                    className="peer sr-only"
                                    disabled={isUploading}
                                />
                                <div className="w-full flex items-start gap-3 p-4 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 peer-checked:border-indigo-700 peer-checked:border-2 peer-checked:bg-indigo-50/30 transition-all">
                                    <MaterialIcon
                                        name="edit_document"
                                        size={24}
                                        className={uploadType === 'revised' ? 'text-indigo-700' : 'text-neutral-400'}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-neutral-900">Revised Version</span>
                                        <span className="text-xs text-neutral-500 mt-0.5">Internal edits or new draft</span>
                                    </div>
                                </div>
                            </label>

                            <label className="relative flex cursor-pointer">
                                <input
                                    type="radio"
                                    name="upload_type"
                                    value="counterparty"
                                    checked={uploadType === 'counterparty'}
                                    onChange={() => setUploadType('counterparty')}
                                    className="peer sr-only"
                                    disabled={isUploading}
                                />
                                <div className="w-full flex items-start gap-3 p-4 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 peer-checked:border-indigo-700 peer-checked:border-2 peer-checked:bg-indigo-50/30 transition-all">
                                    <MaterialIcon
                                        name="reply"
                                        size={24}
                                        className={uploadType === 'counterparty' ? 'text-indigo-700' : 'text-neutral-400'}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-neutral-900">Counterparty Response</span>
                                        <span className="text-xs text-neutral-500 mt-0.5">Redlines from the other party</span>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Warning Banner */}
                    <div className="flex gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 items-start">
                        <MaterialIcon name="warning" size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm leading-relaxed">
                            <p className="font-bold mb-0.5 text-amber-800">Existing Approvals</p>
                            <p className="opacity-90">This contract has existing approvals. Uploading a new version will flag reviewers to check changes.</p>
                        </div>
                    </div>

                    {/* Change Notes */}
                    <div>
                        <div className="flex justify-between items-baseline mb-2">
                            <label className="text-sm font-bold text-neutral-900 flex items-center gap-1" htmlFor="change-notes">
                                Change Notes <span className="text-red-500 text-lg leading-none">*</span>
                            </label>
                            <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                                {changeNotes.length} / 10 min
                            </span>
                        </div>
                        <div className="relative">
                            <Textarea
                                id="change-notes"
                                placeholder="Describe key changes made in this version..."
                                value={changeNotes}
                                onChange={(e) => setChangeNotes(e.target.value)}
                                rows={4}
                                disabled={isUploading}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-neutral-200 bg-neutral-50/80">
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || changeNotes.length < 10 || isUploading}
                        className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-md transition-all"
                    >
                        {isUploading ? (
                            <>
                                <MaterialIcon name="sync" size={20} className="animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <MaterialIcon name="cloud_upload" size={20} />
                                Upload &amp; Save
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
