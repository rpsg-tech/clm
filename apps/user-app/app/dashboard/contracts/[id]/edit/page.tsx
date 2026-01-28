'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spinner, Badge } from '@repo/ui';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { ArrowLeft, Save, Send, Wand2, LayoutTemplate, Maximize2, Minimize2, FileText, CheckCircle2 } from 'lucide-react';
import { AnnexureItem, AnnexuresView } from '@/components/annexures-view';
import { PageErrorBoundary } from '@/components/error-boundary';
import { ContractAssistantSidebar } from '@/components/contract-assistant-sidebar';

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
    const [activeTab, setActiveTab] = useState<'main' | 'annexures'>('annexures'); // Default to editable tab

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
        setAnnexures(prev => [
            ...prev,
            { id: `annex-${Date.now()}`, title: `Annexure ${String.fromCharCode(65 + prev.length)}`, content: '' }
        ]);
    };
    const handleRemoveAnnexure = (id: string) => {
        if (annexures.length <= 1) return;
        setAnnexures(prev => prev.filter(a => a.id !== id));
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
    if (!contract) return <div className="text-center py-12">Contract not found</div>;

    return (
        <div className={`flex flex-col h-[calc(100vh-2rem)] -m-4 bg-slate-50 overflow-hidden relative ${focusMode ? 'fixed inset-0 z-50 m-0' : ''}`}>

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => focusMode ? setFocusMode(false) : router.back()} className="rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 group">
                            {isEditingTitle ? (
                                <input
                                    autoFocus
                                    className="font-bold text-slate-900 border-b border-orange-300 outline-none bg-transparent min-w-[200px]"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={() => setIsEditingTitle(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                                />
                            ) : (
                                <h1
                                    className="font-bold text-slate-900 cursor-pointer hover:text-orange-600 transition-colors text-lg"
                                    onClick={() => setIsEditingTitle(true)}
                                    title="Click to edit title"
                                >
                                    {title}
                                </h1>
                            )}
                            <Badge variant="outline" className="text-[10px] font-bold tracking-wider">{contract.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                            <span>{contract.reference}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{contract.template?.name || 'Template'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>Last saved: {isSaving ? 'Saving...' : 'Just now'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                        <button
                            onClick={() => setActiveTab('main')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'main'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Main Agreement
                        </button>
                        <button
                            onClick={() => setActiveTab('annexures')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'annexures'
                                    ? 'bg-white text-orange-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Annexures
                            {annexures.length > 0 && <span className="bg-slate-200 text-slate-600 px-1.5 rounded-full text-[9px]">{annexures.length}</span>}
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-1" />

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className={`hidden md:flex gap-2 ${showAiPanel ? 'bg-orange-50 text-orange-700 border-orange-100' : ''}`}
                    >
                        <Wand2 size={14} />
                        AI Assistant
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFocusMode(!focusMode)}
                        className="hidden md:flex gap-2"
                    >
                        {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        {focusMode ? 'Exit Focus' : 'Focus Mode'}
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>

                    <Button onClick={handleSubmit} disabled={isApproveLoading || isSaving} className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20">
                        <Send className="w-4 h-4 mr-2" />
                        Submit for Review
                    </Button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden relative">
                <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden relative">

                    {activeTab === 'main' ? (
                        <div className="flex-1 overflow-y-auto p-4 md:p-8">
                            <div className="max-w-[850px] mx-auto bg-white rounded-xl shadow-sm border border-slate-200 min-h-[800px] p-12">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <FileText className="w-5 h-5" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Read Only Mode</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-slate-100">Fixed Content</Badge>
                                </div>
                                <div
                                    className="prose prose-slate max-w-none"
                                    dangerouslySetInnerHTML={{ __html: contract.content || '<p class="text-slate-400 italic text-center py-10">No main content available.</p>' }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
                            <AnnexuresView
                                annexures={annexures}
                                onAnnexureChange={handleAnnexureChange}
                                onUpdate={() => { }}
                                onAdd={handleAddAnnexure}
                                onRemove={handleRemoveAnnexure}
                                onTitleChange={handleTitleChange}
                            />
                        </div>
                    )}

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
