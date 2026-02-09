'use client';

import { Input, Textarea } from '@repo/ui';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { ExtractedMetadata } from '@/lib/ai-mock';

interface UploadMetadataFormProps {
    metadata: ExtractedMetadata;
    onChange: (metadata: ExtractedMetadata) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export function UploadMetadataForm({
    metadata,
    onChange,
    onSubmit,
    isSubmitting,
}: UploadMetadataFormProps) {
    function update(field: keyof ExtractedMetadata, value: string | number | null) {
        onChange({ ...metadata, [field]: value });
    }

    return (
        <div className="space-y-6 p-6">
            {/* AI Confidence Banner */}
            <div className="flex items-center gap-2 rounded-lg bg-violet-50 border border-violet-100 px-4 py-3">
                <MaterialIcon name="auto_awesome" size={18} className="text-violet-600" />
                <span className="text-sm font-medium text-violet-700">
                    AI Extracted Data
                </span>
                <span className="text-xs text-violet-500 ml-auto">
                    {Math.round(metadata.confidence * 100)}% confidence
                </span>
            </div>

            <div>
                <h2 className="text-xl font-bold text-neutral-900">Review Details</h2>
                <p className="mt-1 text-sm text-neutral-500">
                    Verify and edit the information extracted from your document.
                </p>
            </div>

            <div className="space-y-4">
                <label className="block">
                    <span className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                        Contract Title <span className="text-red-500">*</span>
                        <MaterialIcon name="auto_awesome" size={14} className="text-violet-400" />
                    </span>
                    <Input
                        placeholder="e.g., MSA - Acme Corp Q2 2026"
                        value={metadata.title}
                        onChange={(e) => update('title', e.target.value)}
                        required
                        className="h-11"
                    />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                            Counterparty Name
                            <MaterialIcon name="auto_awesome" size={14} className="text-violet-400" />
                        </span>
                        <Input
                            placeholder="Company or individual name"
                            value={metadata.counterpartyName}
                            onChange={(e) => update('counterpartyName', e.target.value)}
                            className="h-11"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                            Counterparty Email
                        </span>
                        <Input
                            type="email"
                            placeholder="contact@counterparty.com"
                            value={metadata.counterpartyEmail}
                            onChange={(e) => update('counterpartyEmail', e.target.value)}
                            className="h-11"
                        />
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                            Start Date
                            <MaterialIcon name="auto_awesome" size={14} className="text-violet-400" />
                        </span>
                        <Input
                            type="date"
                            value={metadata.startDate}
                            onChange={(e) => update('startDate', e.target.value)}
                            className="h-11"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                            Expiry Date
                        </span>
                        <Input
                            type="date"
                            value={metadata.endDate}
                            onChange={(e) => update('endDate', e.target.value)}
                            className="h-11"
                        />
                    </label>
                </div>

                <label className="block">
                    <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                        Contract Value
                    </span>
                    <Input
                        type="number"
                        placeholder="0.00"
                        value={metadata.amount ?? ''}
                        onChange={(e) =>
                            update('amount', e.target.value ? Number(e.target.value) : null)
                        }
                        className="h-11"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                        Description
                    </span>
                    <Textarea
                        placeholder="Brief description of the contract purpose..."
                        value={metadata.description}
                        onChange={(e) => update('description', e.target.value)}
                        rows={3}
                    />
                </label>
            </div>

            <div className="pt-4 border-t border-neutral-200">
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting || !metadata.title.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-neutral-300 text-white font-medium py-2.5 px-5 rounded-lg transition-colors"
                >
                    {isSubmitting ? (
                        <>
                            <MaterialIcon name="sync" size={18} className="animate-spin" />
                            Creating Contract...
                        </>
                    ) : (
                        <>
                            <MaterialIcon name="add_circle" size={18} />
                            Create Contract
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
