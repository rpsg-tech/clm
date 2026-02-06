'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spinner, Badge } from '@repo/ui';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { MaterialIcon } from '@/components/ui/material-icon';
import { AnnexureItem, AnnexuresView } from '@/components/annexures-view';
import { PageErrorBoundary } from '@/components/error-boundary';
import { ContractAssistantSidebar } from '@/components/contract-assistant-sidebar';
import { ContractEditorView, ContractEditorRef } from '@/components/contract-editor-view';
import { ContractNavigationSidebar } from '@/components/contract-navigation-sidebar';
import { DualPaneLayout } from '@/components/layout/dual-pane-layout';
import { AiClauseAssistant } from '@/components/ai-clause-assistant';

interface Contract {
    id: string;
    title: string;
    reference: string;
    status: string;
    createdAt: string;
    annexureData: string;
    content?: string;
    template: { name: string; annexures?: any[] };
    versions: any[];
    counterpartyName?: string;
}

const parseAnnexures = (html: string): AnnexureItem[] => {
    if (!html || !html.trim()) return [];
    if (typeof window === 'undefined') return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const sections = doc.querySelectorAll('.annexure-section');
    if (sections.length > 0) {
        return Array.from(sections).map((sec, i) => {
            const titleEl = sec.querySelector('h3');
            const contentDiv = sec.querySelector('div');
            let content = contentDiv?.innerHTML || '';
            if (!content && !contentDiv) {
                const clone = sec.cloneNode(true) as HTMLElement;
                const h3 = clone.querySelector('h3');
                if (h3) h3.remove();
                content = clone.innerHTML;
            }
            return {
                id: `annex-${i}`,
                title: titleEl?.textContent || `Annexure ${i + 1}`,
                content: content || ''
            };
        });
    }

    const h3s = doc.querySelectorAll('h3');
    if (h3s.length > 0) {
        return Array.from(h3s).map((h3, i) => {
            const title = h3.textContent || `Annexure ${i + 1}`;
            let content = '';
            let next = h3.nextSibling;
            while (next && next.nodeName !== 'H3') {
                if (next.nodeType === Node.ELEMENT_NODE) content += (next as Element).outerHTML;
                else if (next.nodeType === Node.TEXT_NODE) content += next.textContent;
                next = next.nextSibling;
            }
            return { id: `annex-fuzzy-${i}`, title, content: content || ' ' };
        });
    }

    return [{ id: 'annex-legacy', title: 'Annexure Data', content: html }];
};

export default function EditContractPage() {
    return (
        <PageErrorBoundary>
            <EditContractContent />
        </PageErrorBoundary>
    );
}

function EditContractContent() {
    const params = useParams();
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const contractId = params.id as string;

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isApproveLoading, setIsApproveLoading] = useState(false);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [focusMode, setFocusMode] = useState(false);

    // Unified Selection State
    const [activeDocId, setActiveDocId] = useState<string>('main');
    const [selectedText, setSelectedText] = useState("");
    const editorRef = useRef<ContractEditorRef>(null);

    // Data States
    const [contract, setContract] = useState<Contract | null>(null);
    const [title, setTitle] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // Uploaded File Support
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

    // Annexures (Editable)
    const [annexures, setAnnexures] = useState<AnnexureItem[]>([]);

    useEffect(() => {
        loadData();
    }, [contractId]);

    // --- NEW: User Role State (Dev Toggle) ---
    const [userRole, setUserRole] = useState<'LEGAL' | 'BUSINESS'>('LEGAL');

    // Derived: Is Editable?
    // Legal User: Can edit EVERYTHING (Main + Annexures)
    // Business User: Can edit ONLY Annexures (if allowed), Main is Read-Only
    const isMainDocEditable = userRole === 'LEGAL' && !filePreviewUrl;

    // --- Upload Version Logic (Business Flow) ---
    const [showUploadModal, setShowUploadModal] = useState(false);

    const loadData = async () => {
        try {
            const contractData = await api.contracts.get(contractId);
            const c = contractData as any;
            setContract(c);
            setTitle(c.title);

            // Check for uploaded file
            let isUploaded = false;
            if (c.attachments && c.attachments.length > 0) {
                try {
                    isUploaded = true;
                    const res = await api.contracts.getAttachmentDownloadUrl(c.id, c.attachments[0].id);
                    setFilePreviewUrl(res.url);
                } catch (e) {
                    console.error("Failed to load file preview", e);
                }
            }

            if (!isUploaded && typeof window !== 'undefined') {
                const rawAnnexureData = c.annexureData || '';

                if (!rawAnnexureData) {
                    if (c.template?.annexures?.length > 0) {
                        setAnnexures(c.template.annexures.map((a: any) => ({
                            id: a.id || `annex-${Math.random().toString(36).substr(2, 9)}`,
                            title: a.title || a.name,
                            content: a.content || ""
                        })));
                    } else {
                        setAnnexures([{ id: 'annex-init', title: 'Annexure A', content: '<p>Start drafting your annexures...</p>' }]);
                    }
                } else {
                    const parsed = parseAnnexures(rawAnnexureData);
                    setAnnexures(parsed.length > 0 ? parsed : [{ id: 'annex-rescue', title: 'Restored Content', content: rawAnnexureData }]);
                }
            }
        } catch (err) {
            console.error('Failed to load data', err);
            toastError('Error', 'Failed to load contract data');
        } finally {
            setIsLoading(false);
        }
    };

    const getFinalAnnexureHtml = () => {
        if (annexures.length === 0) return "";
        let finalHtml = "";
        annexures.forEach((annexure) => {
            finalHtml += `<div class="annexure-section">`;
            finalHtml += `<h3>${annexure.title}</h3>`;
            finalHtml += `<div>${annexure.content.replace(/\n/g, "<br/>")}</div>`;
            finalHtml += `</div>`;
        });
        return finalHtml;
    };

    const handleSave = async (silent = false) => {
        if (!contract) return;
        setIsSaving(true);
        try {
            const finalAnnexureData = getFinalAnnexureHtml();
            await api.contracts.update(contract.id, {
                title,
                annexureData: finalAnnexureData
            });
            if (!silent) success('Saved', 'Contract updated successfully');
        } catch (err) {
            console.error('Save failed', err);
            toastError('Error', 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDone = async () => {
        if (!contract) return;
        await handleSave(true);
        router.push(`/dashboard/contracts/${contract.id}`);
    };

    const handleAnnexureChange = (id: string, newContent: string) => {
        setAnnexures(prev => prev.map(a => a.id === id ? { ...a, content: newContent } : a));
    };
    const handleTitleChange = (id: string, newTitle: string) => {
        setAnnexures(prev => prev.map(a => a.id === id ? { ...a, title: newTitle } : a));
    };
    const handleAddAnnexure = () => {
        const newId = `annex-${Date.now()}`;
        setAnnexures(prev => [
            ...prev,
            { id: newId, title: `Annexure ${String.fromCharCode(65 + prev.length)}`, content: '' }
        ]);
        setActiveDocId(newId); // Auto-switch to new annexure
    };
    const handleRemoveAnnexure = (id: string) => {
        if (annexures.length <= 1) return;
        setAnnexures(prev => prev.filter(a => a.id !== id));
        if (activeDocId === id) setActiveDocId('main'); // Fallback to main
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
    if (!contract) return <div className="text-center py-12">Contract not found</div>;

    // derived selection
    const activeAnnexure = annexures.find(a => a.id === activeDocId);

    // Construct Nav Items (Order: Main -> Annexures)
    const navItems = [
        { id: 'main', title: 'Main Agreement', type: 'main' as const },
        ...annexures.map(a => ({ id: a.id, title: a.title, type: 'annexure' as const }))
    ];

    // Header Content
    const headerContent = (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-md hover:bg-slate-100 text-slate-500">
                    <MaterialIcon name="arrow_back" className="w-5 h-5" />
                </Button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        {isEditingTitle ? (
                            <input
                                autoFocus
                                className="font-bold text-slate-900 border-b-2 border-indigo-500 outline-none bg-transparent min-w-[200px] text-lg leading-tight"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={() => setIsEditingTitle(false)}
                            />
                        ) : (
                            <h1
                                className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors text-lg leading-tight truncate max-w-[300px]"
                                onClick={() => setIsEditingTitle(true)}
                            >
                                {title}
                            </h1>
                        )}
                        <Badge variant="outline" className={`text-[10px] font-bold tracking-wider px-2 py-0.5 border ${contract.status === 'DRAFT' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                            {contract.status}
                        </Badge>

                        {/* Role Toggle for Demo */}
                        <div className="flex border border-slate-200 rounded-md overflow-hidden h-6">
                            <button
                                onClick={() => setUserRole('LEGAL')}
                                className={`px-2 text-[10px] font-bold uppercase ${userRole === 'LEGAL' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                            >
                                Legal
                            </button>
                            <button
                                onClick={() => setUserRole('BUSINESS')}
                                className={`px-2 text-[10px] font-bold uppercase ${userRole === 'BUSINESS' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                            >
                                Biz
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                        <span>{contract.reference}</span>
                        <span className="text-slate-300">•</span>
                        <span>{contract.template?.name || 'Template'}</span>
                        <span className="text-slate-300">•</span>
                        <span className={isSaving ? 'text-indigo-500' : ''}>{isSaving ? 'Saving...' : 'Saved'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {userRole === 'BUSINESS' && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUploadModal(true)}
                        className="bg-white border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                        <MaterialIcon name="upload_file" className="w-4 h-4 mr-2" />
                        Upload Version
                    </Button>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                    className="hidden sm:flex text-slate-600 font-semibold hover:bg-slate-50"
                >
                    <MaterialIcon name="save" className="w-4 h-4 mr-2 text-slate-400" />
                    Save
                </Button>

                <Button onClick={handleDone} disabled={isApproveLoading || isSaving} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wide h-9 px-5 shadow-md active:scale-95 transition-all">
                    <MaterialIcon name="check" className="w-3.5 h-3.5 mr-2" />
                    Done
                </Button>
            </div>
        </div>
    );

    // Left Pane Content (Editor)
    const leftPaneContent = (
        <div className="h-full bg-white flex flex-col">
            {filePreviewUrl ? (
                /* Uploaded File Preview */
                <iframe
                    src={filePreviewUrl}
                    className="w-full h-full border-none"
                    title="Contract Preview"
                />
            ) : activeDocId === 'main' ? (
                /* Main Agreement */
                <div className="flex flex-col h-full">
                    {!isMainDocEditable && (
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2 text-xs text-slate-500">
                            <MaterialIcon name="lock" className="w-3 h-3" />
                            Read-Only View (Locked by Template)
                        </div>
                    )}
                    < ContractEditorView
                        ref={editorRef}
                        content={contract.content || '<p class="text-slate-400 italic text-center py-10">No content available.</p>'}
                        onChange={() => { }}
                        onSelectionChange={setSelectedText}
                        readOnly={!isMainDocEditable}
                        className="h-full border-none shadow-none rounded-none"
                    />
                </div>
            ) : activeAnnexure ? (
                /* Editable Annexure */
                <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annexure Title</label>
                            <input
                                type="text"
                                value={activeAnnexure.title}
                                onChange={(e) => handleTitleChange(activeAnnexure.id, e.target.value)}
                                className="text-xl font-bold text-slate-900 placeholder-slate-300 border-none p-0 w-full focus:ring-0 bg-transparent"
                            />
                        </div>
                    </div>
                    <ContractEditorView
                        ref={editorRef}
                        content={activeAnnexure.content}
                        onChange={(val) => handleAnnexureChange(activeAnnexure.id, val)}
                        onSelectionChange={setSelectedText}
                        readOnly={false}
                        className="h-full border-none shadow-none rounded-none"
                        toolbarSimple={true}
                    />
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-400">Document not found</div>
            )}
        </div>
    );

    return (
        <PageErrorBoundary>
            <DualPaneLayout
                header={headerContent}
                sidebar={
                    !filePreviewUrl && (
                        <ContractNavigationSidebar
                            items={navItems}
                            activeId={activeDocId}
                            onSelect={setActiveDocId}
                            onAddAnnexure={handleAddAnnexure}
                            onRemoveAnnexure={handleRemoveAnnexure}
                            className="h-full"
                        />
                    )
                }
                leftPane={leftPaneContent}
                rightPane={
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                <MaterialIcon name="auto_fix_high" className="w-4 h-4 text-indigo-600" />
                                Contract Assistant
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <AiClauseAssistant
                                isOpen={true}
                                onClose={() => { }}
                                onInsertClause={(text) => editorRef.current?.insertContent(text)}
                                selectedText={selectedText}
                                embedded={true}
                            />
                        </div>
                    </div>
                }
            />

            {/* Business Upload Modal (Placeholder for now, reusing Alert style) */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Upload New Version</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Drag and drop your updated file here. This will create v{contract?.versions?.length ? contract.versions.length + 1 : 1}.
                        </p>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-400 mb-4">
                            Drop PDF/Word file here
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                            <Button onClick={() => setShowUploadModal(false)}>Upload</Button>
                        </div>
                    </div>
                </div>
            )}
        </PageErrorBoundary>
    );
}

