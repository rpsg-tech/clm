'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spinner, Badge } from '@repo/ui';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { ArrowLeft, Save, Send, Wand2, Maximize2, Minimize2 } from 'lucide-react';
import { AnnexureItem, AnnexuresView } from '@/components/annexures-view';
import { PageErrorBoundary } from '@/components/error-boundary';
import { ContractAssistantSidebar } from '@/components/contract-assistant-sidebar';
import { ContractEditorView } from '@/components/contract-editor-view';
import { ContractNavigationSidebar } from '@/components/contract-navigation-sidebar';

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

    // Data States
    const [contract, setContract] = useState<Contract | null>(null);
    const [title, setTitle] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // Annexures (Editable)
    const [annexures, setAnnexures] = useState<AnnexureItem[]>([]);

    useEffect(() => {
        loadData();
    }, [contractId]);

    const loadData = async () => {
        try {
            const contractData = await api.contracts.get(contractId);
            const c = contractData as any;
            setContract(c);
            setTitle(c.title);

            if (typeof window !== 'undefined') {
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

    const handleSubmit = async () => {
        if (!contract) return;
        await handleSave(true);
        if (confirm("Are you sure you want to submit this contract for review? You will not be able to edit it afterwards.")) {
            setIsApproveLoading(true);
            try {
                await api.contracts.submit(contract.id);
                success('Submitted', 'Contract submitted for approval');
                router.push(`/dashboard/contracts/${contract.id}`);
            } catch (err: any) {
                toastError('Error', err.message || 'Failed to submit contract');
            } finally {
                setIsApproveLoading(false);
            }
        }
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

    return (
        <div className={`flex flex-col h-[calc(100vh-2rem)] -m-4 bg-slate-50 overflow-hidden relative ${focusMode ? 'fixed inset-0 z-50 m-0' : ''}`}>

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-20 h-[72px]">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => focusMode ? setFocusMode(false) : router.back()} className="rounded-xl hover:bg-slate-100 text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            {isEditingTitle ? (
                                <input
                                    autoFocus
                                    className="font-bold text-slate-900 border-b-2 border-orange-500 outline-none bg-transparent min-w-[200px] text-lg leading-tight"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={() => setIsEditingTitle(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                                />
                            ) : (
                                <h1
                                    className="font-bold text-slate-900 cursor-pointer hover:text-orange-600 transition-colors text-lg leading-tight truncate max-w-[300px]"
                                    onClick={() => setIsEditingTitle(true)}
                                    title="Click to edit title"
                                >
                                    {title}
                                </h1>
                            )}
                            <Badge variant="outline" className={`text-[10px] font-bold tracking-wider px-2 py-0.5 border ${contract.status === 'DRAFT' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                {contract.status}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                            <span>{contract.reference}</span>
                            <span className="text-slate-300">•</span>
                            <span>{contract.template?.name || 'Template'}</span>
                            <span className="text-slate-300">•</span>
                            <span className={isSaving ? 'text-orange-500' : ''}>{isSaving ? 'Saving...' : 'Saved'}</span>
                        </div>
                    </div>
                </div>

                {/* Right Actions (No Segmented Control anymore) */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className={`hidden lg:flex gap-2 h-9 font-semibold ${showAiPanel ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Wand2 size={14} className={showAiPanel ? 'text-orange-500' : 'text-slate-400'} />
                        <span className="hidden xl:inline">AI Assistant</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFocusMode(!focusMode)}
                        className="hidden lg:flex text-slate-400 hover:text-slate-900"
                        title="Toggle Focus Mode"
                    >
                        {focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </Button>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSave(false)}
                        disabled={isSaving}
                        className="hidden sm:flex text-slate-600 font-semibold hover:bg-slate-50"
                    >
                        <Save className="w-4 h-4 mr-2 text-slate-400" />
                        Save
                    </Button>

                    <Button onClick={handleSubmit} disabled={isApproveLoading || isSaving} className="bg-orange-600 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wide h-9 px-5 shadow-lg shadow-orange-600/20 active:scale-95 transition-all">
                        <Send className="w-3.5 h-3.5 mr-2" />
                        Submit
                    </Button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Unified Sidebar */}
                <div className="w-[300px] border-r border-slate-200 hidden md:block z-10">
                    <ContractNavigationSidebar
                        items={navItems}
                        activeId={activeDocId}
                        onSelect={setActiveDocId}
                        onAddAnnexure={handleAddAnnexure}
                        onRemoveAnnexure={handleRemoveAnnexure}
                        className="h-full"
                    />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden relative">
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white md:p-0">
                        {activeDocId === 'main' ? (
                            /* Read Only Main Agreement */
                            <ContractEditorView
                                content={contract.content || '<p class="text-slate-400 italic text-center py-10">No main content available.</p>'}
                                onChange={() => { }}
                                readOnly={true}
                                className="h-full border-none shadow-none rounded-none"
                            />
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
                                            placeholder="Enter Title..."
                                        />
                                    </div>
                                </div>
                                <ContractEditorView
                                    content={activeAnnexure.content}
                                    onChange={(val) => handleAnnexureChange(activeAnnexure.id, val)}
                                    readOnly={false}
                                    className="h-full border-none shadow-none rounded-none"
                                    toolbarSimple={true}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">Document not found</div>
                        )}
                    </div>
                </main>

                {/* AI Sidebar */}
                <div className={`
                    border-l border-slate-200 bg-white transition-all duration-300 ease-in-out flex flex-col z-30 shadow-xl
                        ${showAiPanel ? 'w-[350px] translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}
                `}>
                    <div className="h-full flex flex-col min-w-[350px]">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                <Wand2 className="w-4 h-4 text-orange-600" />
                                Contract Assistant
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowAiPanel(false)} className="h-7 w-7 text-slate-400 hover:text-slate-700">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ContractAssistantSidebar embedded className="h-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
