
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';
import { MaterialIcon } from '@/components/ui/material-icon';
import { PartAPreview } from './part-a-preview';
import { PartBEditor } from './part-b-editor';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';

interface SplitViewEditorProps {
    templateId: string;
    template?: any; // strict type later
}

export const SplitViewEditor: React.FC<SplitViewEditorProps> = ({ templateId, template }) => {
    const router = useRouter();
    const { success, error: toastError } = useToast();

    // Mock Content State
    const [partAContent] = useState(template?.content_locked || `
        <h2>Master Services Agreement</h2>
        <p>This Master Services Agreement ("Agreement") is made between <strong>RPSG Group</strong> ("Party A") and the counterparty identified in Annexure A ("Party B").</p>
        <p>1. <strong>Services</strong>. Party B shall provide services as described in the attached Annexures.</p>
        <p>2. <strong>Term</strong>. This agreement shall be approximately valid for 12 months unless terminated earlier.</p>
        <p>3. <strong>Confidentiality</strong>. Both parties agree to maintain strict confidentiality.</p>
        <br/>
        <p class="text-xs text-gray-400">Locked content from Template: ${template?.name || 'Standard MSA'}</p>
    `);

    const [partBContent, setPartBContent] = useState(template?.content_annexure || `
        <h3>Annexure A: Commercial Details</h3>
        <p><strong>Counterparty Name:</strong> [Enter Name]</p>
        <p><strong>Service Fee:</strong> INR 50,000 per month</p>
        <p><strong>Scope of Work:</strong></p>
        <ul>
            <li>Item 1</li>
            <li>Item 2</li>
        </ul>
    `);

    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleBack = () => {
        if (isPreviewMode) {
            setIsPreviewMode(false);
        } else {
            router.back();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // In a real app, we would grab Party B details from the content or a side form
            // For this flow, we assume simple creation
            await api.contracts.create({
                templateId,
                title: `Draft - ${template?.name || 'Contract'}`,
                counterpartyName: "TBD", // Extracted or set later
                description: "Created via Split View Editor",
                annexureData: partBContent,
                fieldData: {}
            });
            success("Contract drafted successfully");
            router.push('/dashboard/contracts');
        } catch (err) {
            console.error(err);
            toastError("Failed to create contract");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100">
            {/* Toolbar / Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={handleBack} className="text-slate-500">
                        <MaterialIcon name="arrow_back" className="w-4 h-4 mr-2" />
                        {isPreviewMode ? "Back to Edit" : "Back"}
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">
                            {template?.name || 'Drafting Agreement'}
                        </h1>
                        <p className="text-xs text-slate-500">
                            {isPreviewMode ? 'Review merged document' : 'Split View Drafting'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isPreviewMode ? (
                        <Button variant="outline" onClick={() => setIsPreviewMode(true)}>
                            <MaterialIcon name="visibility" className="w-4 h-4 mr-2" />
                            Preview Merged
                        </Button>
                    ) : (
                        <div className="text-sm text-slate-500 italic mr-2">Preview Mode</div>
                    )}

                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Contract'}
                        <MaterialIcon name="check" className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {isPreviewMode ? (
                    /* Unified Preview Mode */
                    <div className="h-full overflow-y-auto bg-slate-100 p-8 flex justify-center">
                        <div className="max-w-4xl w-full bg-white shadow-lg min-h-screen p-12">
                            <div className="mb-12 border-b-2 border-slate-100 pb-8">
                                <h2 className="text-center text-slate-400 uppercase tracking-widest text-sm mb-4">Unified Draft</h2>
                                <div className="prose max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: partAContent }} />
                            </div>
                            <div className="bg-emerald-50/30 p-8 -mx-8 rounded-lg border border-dashed border-emerald-100">
                                <div className="prose max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: partBContent }} />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Split View Mode */
                    <div className="grid grid-cols-2 h-full">
                        <PartAPreview content={partAContent} />
                        <PartBEditor content={partBContent} onChange={setPartBContent} />
                    </div>
                )}
            </div>
        </div>
    );
};
