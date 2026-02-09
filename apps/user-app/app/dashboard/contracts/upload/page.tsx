'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/lib/toast-context';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { mockAnalyzeFile, type ExtractedMetadata } from '@/lib/ai-mock';
import { MaterialIcon } from '@/components/ui/material-icon';
import { FileDropZone } from '@/components/contracts/file-drop-zone';
import { FilePreview } from '@/components/contracts/file-preview';
import { AiProcessingOverlay } from '@/components/contracts/ai-processing-overlay';
import { DualPaneLayout } from '@/components/contracts/dual-pane-layout';
import { UploadMetadataForm } from '@/components/contracts/upload-metadata-form';
import type { Template } from '@repo/types';

type UploadStage = 'upload' | 'processing' | 'review';

function isTemplate(value: unknown): value is Template {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof (value as { id?: unknown }).id === 'string'
    );
}

function extractId(value: unknown): string | null {
    if (typeof value === 'object' && value !== null && 'id' in value) {
        const id = (value as { id?: unknown }).id;
        return typeof id === 'string' ? id : null;
    }
    return null;
}

export default function UploadContractPage() {
    const router = useRouter();
    const { currentOrg } = useAuth();
    const { success, error: showError } = useToast();

    const [stage, setStage] = useState<UploadStage>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleFileSelect = useCallback(async (selectedFile: File) => {
        setFile(selectedFile);
        setStage('processing');

        try {
            // TODO: Replace with real API call when backend AI endpoint is ready
            const extracted = await mockAnalyzeFile(selectedFile.name);
            setMetadata(extracted);
            setStage('review');
        } catch {
            showError('Processing Failed', 'Could not analyze the document. Please try again.');
            setStage('upload');
            setFile(null);
        }
    }, [showError]);

    const handleReUpload = useCallback(() => {
        setStage('upload');
        setFile(null);
        setMetadata(null);
    }, []);

    const handleCreate = useCallback(async () => {
        if (!metadata || !file || !currentOrg) return;

        setIsCreating(true);
        try {
            // Fetch a fallback template for uploaded documents
            // TODO: Use a dedicated "Third Party Upload" template when available
            const templatesRes = await api.templates.list({ limit: 1 });
            const templates = Array.isArray(templatesRes?.data)
                ? templatesRes.data.filter(isTemplate)
                : [];
            if (templates.length === 0) {
                showError('No Templates', 'No templates are available. Please contact your admin.');
                setIsCreating(false);
                return;
            }
            const templateId = templates[0].id;

            // 1. Create the contract
            const contract = await api.contracts.create({
                templateId,
                title: metadata.title,
                counterpartyName: metadata.counterpartyName || undefined,
                counterpartyEmail: metadata.counterpartyEmail || undefined,
                startDate: metadata.startDate || undefined,
                endDate: metadata.endDate || undefined,
                amount: metadata.amount ?? undefined,
                description: metadata.description || undefined,
                annexureData: JSON.stringify({}),
                fieldData: {},
            });

            const contractId = extractId(contract);
            if (!contractId) {
                throw new Error('Contract creation failed.');
            }

            // 2. Upload the file via presigned URL
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

            success('Contract Created', 'Your document has been uploaded and contract created.');
            router.push(`/dashboard/contracts/${contractId}`);
        } catch (err) {
            showError(
                'Upload Failed',
                err instanceof Error ? err.message : 'Failed to create contract'
            );
        } finally {
            setIsCreating(false);
        }
    }, [metadata, file, currentOrg, success, showError, router]);

    return (
        <>
            <AiProcessingOverlay isProcessing={stage === 'processing'} />

            <div className="space-y-6">
                {/* Back link + header */}
                <div>
                    <Link
                        href="/dashboard/contracts/create"
                        className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800 font-medium mb-4"
                    >
                        <MaterialIcon name="arrow_back" size={16} />
                        Back to Templates
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                        Upload Document
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Upload a third-party contract or existing document. AI will extract key details automatically.
                    </p>
                </div>

                {stage === 'upload' && (
                    <div className="max-w-2xl mx-auto">
                        <FileDropZone onFileSelect={handleFileSelect} />
                    </div>
                )}

                {stage === 'review' && metadata && (
                    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-neutral-50/50">
                            <span className="text-sm font-medium text-neutral-700">
                                Review Extracted Information
                            </span>
                            <button
                                onClick={handleReUpload}
                                className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                            >
                                <MaterialIcon name="upload_file" size={16} />
                                Re-upload
                            </button>
                        </div>

                        <div className="h-[calc(100vh-18rem)]">
                            <DualPaneLayout
                                left={<FilePreview file={file} className="h-full" />}
                                right={
                                    <UploadMetadataForm
                                        metadata={metadata}
                                        onChange={setMetadata}
                                        onSubmit={handleCreate}
                                        isSubmitting={isCreating}
                                    />
                                }
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
