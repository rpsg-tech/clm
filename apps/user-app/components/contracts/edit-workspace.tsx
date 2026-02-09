'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { api } from '@/lib/api-client';
import { ContractStatus, RoleCode } from '@repo/types';
import { TipTapEditor, type TipTapEditorRef } from '@/components/editor/tip-tap-editor';
import { WorkspaceHeader } from '@/components/contracts/workspace-header';
import { ContractNavSidebar } from '@/components/contracts/contract-nav-sidebar';
import { AiAssistantPanel } from '@/components/contracts/ai-assistant-panel';
import { UploadVersionModal } from '@/components/contracts/upload-version-modal';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { Contract } from '@repo/types';

const LEGAL_ROLES: string[] = [RoleCode.LEGAL_HEAD, RoleCode.LEGAL_MANAGER, RoleCode.SUPER_ADMIN, RoleCode.ENTITY_ADMIN];

interface EditWorkspaceProps {
    contract: Contract;
}

function formatTimeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export function EditWorkspace({ contract }: EditWorkspaceProps) {
    const router = useRouter();
    const { role } = useAuth();
    const { success, error: showError } = useToast();

    const isLegal = role ? LEGAL_ROLES.includes(role) : false;
    const canEdit =
        isLegal &&
        (contract.status === ContractStatus.DRAFT ||
            contract.status === ContractStatus.REVISION_REQUESTED);

    // Editor state — use annexureData as editable content
    const initialContent = contract.annexureData || contract.content || '';
    const [content, setContent] = useState<string>(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showAiPanel, setShowAiPanel] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const editorRef = useRef<TipTapEditorRef>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced auto-save
    const handleContentChange = useCallback(
        (newContent: string) => {
            setContent(newContent);

            if (!canEdit) return;

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(async () => {
                setIsSaving(true);
                try {
                    await api.contracts.update(contract.id, {
                        annexureData: newContent,
                    });
                    setLastSaved(new Date());
                } catch {
                    showError('Save Failed', 'Could not save changes. Please try again.');
                } finally {
                    setIsSaving(false);
                }
            }, 2000);
        },
        [canEdit, contract.id, showError]
    );

    // Cleanup save timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const handleSubmit = useCallback(async () => {
        try {
            // Flush any pending save first
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                if (canEdit && content !== initialContent) {
                    await api.contracts.update(contract.id, {
                        annexureData: content,
                    });
                }
            }

            await api.contracts.submit(contract.id, { target: 'LEGAL' });
            success('Submitted', 'Contract has been submitted for review.');
            router.push(`/dashboard/contracts/${contract.id}`);
        } catch (err) {
            showError(
                'Submit Failed',
                err instanceof Error ? err.message : 'Could not submit contract'
            );
        }
    }, [contract.id, content, initialContent, canEdit, success, showError, router]);

    const handleInsertText = useCallback((text: string) => {
        editorRef.current?.insertContent(text);
    }, []);

    return (
        <>
            <div className="-m-6 flex h-[calc(100vh-4rem)]">
                {/* Left: Navigation Sidebar */}
                <div className="w-64 border-r border-neutral-200 bg-white flex-shrink-0 overflow-y-auto hidden lg:block">
                    <ContractNavSidebar contract={contract} />
                </div>

                {/* Center: Editor */}
                <div className="flex-1 flex flex-col min-w-0 bg-neutral-50">
                    <WorkspaceHeader
                        contract={contract}
                        isSaving={isSaving}
                        lastSaved={lastSaved}
                        canEdit={canEdit}
                        isLegal={isLegal}
                        onSubmit={handleSubmit}
                        onToggleAi={() => setShowAiPanel(!showAiPanel)}
                        showAiPanel={showAiPanel}
                        onUploadVersion={() => setShowUploadModal(true)}
                    />
                    <div className="flex-1 overflow-y-auto relative">
                        <div className="min-h-full py-8 px-4 md:px-12 lg:px-24">
                            <div className="max-w-[850px] mx-auto bg-white shadow-sm border border-neutral-200 min-h-[800px] rounded-sm flex flex-col">
                                {/* LOCKED PART A */}
                                {contract.content && (
                                    <>
                                        {/* Part A Banner - Sticky */}
                                        <div className="bg-neutral-200 border-b border-neutral-300 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
                                            <div className="flex items-center gap-2 text-neutral-500">
                                                <MaterialIcon name="lock" size={18} />
                                                <span className="text-xs font-bold uppercase tracking-wide">Legal Terms — Read Only</span>
                                            </div>
                                            <button className="text-xs text-indigo-600 hover:underline font-medium">Request Changes</button>
                                        </div>

                                        {/* Part A Content */}
                                        <div className="p-8 relative">
                                            <div
                                                className="font-serif text-[15px] prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-lg text-neutral-500 select-none pointer-events-none opacity-80"
                                                dangerouslySetInnerHTML={{ __html: contract.content }}
                                            />
                                            {/* Gradient fade at bottom */}
                                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                                        </div>

                                        {/* End of Part A Divider */}
                                        <div className="w-full py-6 flex items-center gap-4 px-8">
                                            <div className="h-px flex-1 border-t border-dashed border-neutral-400"></div>
                                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest bg-neutral-200/50 px-2 rounded">End of Part A</span>
                                            <div className="h-px flex-1 border-t border-dashed border-neutral-400"></div>
                                        </div>
                                    </>
                                )}

                                {/* EDITABLE PART B */}
                                <div className="flex-1 flex flex-col">
                                    {contract.content && (
                                        <div className="px-8 pt-6 pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider select-none">
                                                <MaterialIcon name="edit_note" size={14} />
                                                Part B — Annexures & Schedules
                                            </div>
                                        </div>
                                    )}
                                    <TipTapEditor
                                        ref={editorRef}
                                        content={content}
                                        onChange={handleContentChange}
                                        editable={canEdit}
                                        placeholder={contract.content ? "Start writing Annexures..." : "Start writing your contract..."}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Status Bar */}
                    <footer className="h-16 bg-white border-t border-neutral-200 px-6 flex items-center justify-between flex-shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] z-20">
                        <div className="text-xs text-neutral-500">
                            <span className="font-semibold">Status:</span> {contract.status} {isSaving ? '(Saving...)' : lastSaved ? `(Saved ${formatTimeSince(lastSaved)})` : '(Unsaved changes)'}
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/dashboard/contracts/${contract.id}`}>
                                <button className="h-9 px-4 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
                                    Preview Full Document
                                </button>
                            </Link>
                            {canEdit && (
                                <button
                                    onClick={handleSubmit}
                                    className="h-9 px-6 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-sm font-medium text-white shadow-sm transition-colors flex items-center gap-2"
                                >
                                    <MaterialIcon name="save" size={18} />
                                    <span>Save Draft</span>
                                </button>
                            )}
                        </div>
                    </footer>
                </div>

                {/* Right: AI Assistant */}
                {showAiPanel && (
                    <div className="w-80 border-l border-neutral-200 bg-white flex-shrink-0 flex flex-col overflow-hidden shadow-xl shadow-neutral-200/50 z-20">
                        <AiAssistantPanel
                            contractId={contract.id}
                            onInsertText={canEdit ? handleInsertText : undefined}
                        />
                    </div>
                )}
            </div>

            <UploadVersionModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                contractId={contract.id}
                onSuccess={() => router.refresh()}
            />
        </>
    );
}
