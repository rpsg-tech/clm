'use client';

import { useState } from 'react';
import { TipTapEditor } from '@/components/editor/tip-tap-editor';
import { AiAssistantPanel } from '@/components/contracts/ai-assistant-panel';
import { MaterialIcon } from '@/components/ui/material-icon';

interface AnnexureEditorStepProps {
    templateContent: string;
    annexureContent: string;
    onAnnexureChange: (html: string) => void;
    contractId?: string;
}

export function AnnexureEditorStep({
    templateContent,
    annexureContent,
    onAnnexureChange,
    contractId,
}: AnnexureEditorStepProps) {
    const [showAiPanel, setShowAiPanel] = useState(false);

    return (
        <div className="-mx-[calc(50vw-50%)] px-4">
            <div className="flex items-start gap-6">
                <div className="flex-1 min-w-0">
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
                            <div>
                                <p className="text-sm font-semibold text-neutral-900">Edit Annexures</p>
                                <p className="text-xs text-neutral-500">Part A is locked. Edit Part B below.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAiPanel((prev) => !prev)}
                                className="inline-flex items-center gap-2 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-md hover:bg-primary-100 transition-colors"
                            >
                                <MaterialIcon name="auto_awesome" size={16} />
                                {showAiPanel ? 'Hide AI Panel' : 'Show AI Panel'}
                            </button>
                        </div>

                        <div className="min-h-[720px]">
                            {/* Part A Banner - Sticky */}
                            <div className="bg-neutral-200 border-b border-neutral-300 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-2 text-neutral-500">
                                    <MaterialIcon name="lock" size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wide">Legal Terms — Read Only</span>
                                </div>
                            </div>

                            {/* Part A Content */}
                            <div className="p-8 relative">
                                <div
                                    className="font-serif text-[15px] prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-lg text-neutral-500 select-none pointer-events-none opacity-80"
                                    dangerouslySetInnerHTML={{ __html: templateContent }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                            </div>

                            {/* End of Part A Divider */}
                            <div className="w-full py-6 flex items-center gap-4 px-8">
                                <div className="h-px flex-1 border-t border-dashed border-neutral-400" />
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest bg-neutral-200/50 px-2 rounded">
                                    End of Part A
                                </span>
                                <div className="h-px flex-1 border-t border-dashed border-neutral-400" />
                            </div>

                            {/* Part B Editable */}
                            <div className="flex-1 flex flex-col">
                                <div className="px-8 pt-6 pb-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider select-none">
                                        <MaterialIcon name="edit_note" size={14} />
                                        Part B — Annexures & Schedules
                                    </div>
                                </div>
                                <TipTapEditor
                                    content={annexureContent}
                                    onChange={onAnnexureChange}
                                    editable={true}
                                    placeholder="Start writing Annexures..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {showAiPanel && (
                    <aside className="w-80 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <AiAssistantPanel contractId={contractId || 'draft'} />
                    </aside>
                )}
            </div>
        </div>
    );
}
