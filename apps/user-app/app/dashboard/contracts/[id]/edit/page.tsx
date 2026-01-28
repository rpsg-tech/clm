'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spinner, Badge, Card, CardHeader, CardTitle, CardContent } from '@repo/ui';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { ArrowLeft, Save, Send, CheckCircle, Upload, History, ChevronDown, PanelRightOpen, PanelRightClose, Sparkles, FileText, Globe } from 'lucide-react';
import { TipTapEditor } from '@/components/editor/tip-tap-editor';
import { AiClauseAssistant } from '@/components/ai-clause-assistant';
import { format } from 'date-fns';

interface ContractVersion {
    id: string;
    version: number;
    createdAt: string;
    createdBy?: { name: string };
}

interface Contract {
    id: string;
    title: string;
    reference: string;
    status: string;
    createdAt: string;
    annexureData: string;
    template: { name: string };
    versions: ContractVersion[];
    counterpartyName?: string;
}

import { PageErrorBoundary } from '@/components/error-boundary';

const parseAnnexures = (html: string): AnnexureItem[] => {
    if (!html || !html.trim()) return [];
    if (typeof window === 'undefined') return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Try Standard Parsing (.annexure-section)
    const sections = doc.querySelectorAll('.annexure-section');
    if (sections.length > 0) {
        return Array.from(sections).map((sec, i) => {
            const titleEl = sec.querySelector('h3');
            const contentDiv = sec.querySelector('div');
            // If contentDiv is missing but text exists, use innerHTML of sec minus title
            // But for now, assume structure is consistent or take whole sec innerHTML if uncertain
            let content = contentDiv?.innerHTML || '';
            if (!content && !contentDiv) {
                // Fallback: try to get content after h3
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

    // 2. Fuzzy Parsing (Legacy or Stripped Classes)
    // Look for H3 headers acting as separators
    const h3s = doc.querySelectorAll('h3');
    if (h3s.length > 0) {
        const items: AnnexureItem[] = [];
        h3s.forEach((h3, i) => {
            const title = h3.textContent || `Annexure ${i + 1}`;
            // Collect content until next H3
            let content = '';
            let next = h3.nextSibling;
            while (next && next.nodeName !== 'H3') {
                if (next.nodeType === Node.ELEMENT_NODE) {
                    content += (next as Element).outerHTML;
                } else if (next.nodeType === Node.TEXT_NODE) {
                    content += next.textContent;
                }
                next = next.nextSibling;
            }
            items.push({ id: `annex-fuzzy-${i}`, title, content: content || ' ' }); // prevent empty content
        });
        if (items.length > 0) return items;
    }

    // 3. Last Resort: Treat whole blob as one annexure
    return [{ id: 'annex-legacy', title: 'Annexure Data', content: html }];
};

import { AnnexureItem, AnnexuresView } from '@/components/annexures-view';
import { ContractEditorView } from '@/components/contract-editor-view';

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
    const [activeTab, setActiveTab] = useState<'main' | 'annexures'>('main');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Data States
    const [contract, setContract] = useState<Contract | null>(null);
    const [title, setTitle] = useState('');

    // Main Agreement (Fixed)
    const [fixedContent, setFixedContent] = useState('');

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

            // 1. Set Main Agreement (Read Only)
            setFixedContent(c.content || '');

            // 2. Parse Annexures
            if (typeof window !== 'undefined') {
                const rawAnnexureData = c.annexureData || '';
                // Only try parsing if we have data. If empty, set default.
                if (!rawAnnexureData) {
                    setAnnexures([{ id: 'annex-init', title: 'Annexure A', content: '<p>Start drafting your annexures...</p>' }]);
                } else {
                    const parsed = parseAnnexures(rawAnnexureData);
                    // parseAnnexures handles fallbacks, so parsed should not be empty if rawAnnexureData is not empty.
                    // But just in case:
                    if (parsed.length === 0) {
                        // Should technically not happen due to parseAnnexures logic, but safety first
                        setAnnexures([{ id: 'annex-rescue', title: 'Restored Content', content: rawAnnexureData }]);
                    } else {
                        setAnnexures(parsed);
                    }
                }
            }

        } catch (err) {
            console.error('Failed to load data', err);
            toastError('Error', 'Failed to load contract data');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Reconstruct HTML for Saving ---
    const getFinalAnnexureHtml = () => {
        if (annexures.length === 0) return "";

        let finalHtml = "";

        // Consistent with NewContractPage logic
        finalHtml += '<div style="page-break-before: always; break-before: page; height: 1px; display: block;"></div>';
        finalHtml += "<h2 style='text-align:center; text-transform: uppercase; margin-bottom: 2rem; margin-top: 2rem;'>ANNEXURES</h2>";

        annexures.forEach((annexure, index) => {
            if (index > 0) {
                finalHtml += '<div style="page-break-before: always; break-before: page; height: 1px; display: block;"></div>';
            }
            if (index === 0) finalHtml += "<br/>";

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

    // --- Handlers for AnnexureView ---
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
        <div className="flex flex-col h-[calc(100vh-2rem)] -m-4 bg-neutral-50 overflow-hidden relative">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-slate-900">{title}</h1>
                            <Badge variant="outline" className="text-[10px]">{contract.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">Editing Contract Contents</p>
                    </div>
                </div>

                {/* Mode Switcher */}
                <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
                    <button
                        onClick={() => setActiveTab('main')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'main' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Main Agreement
                    </button>
                    <button
                        onClick={() => setActiveTab('annexures')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'annexures' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Annexures
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden p-6">
                <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

                    {activeTab === 'main' ? (
                        <div className="flex-1 flex flex-col relative animate-in fade-in zoom-in-95 duration-200 min-h-0">
                            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                    <FileText size={14} /> Main Agreement Content
                                </span>
                                <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded">READ ONLY</span>
                            </div>
                            <div className="flex-1 relative">
                                <ContractEditorView
                                    content={fixedContent}
                                    onChange={() => { }}
                                    readOnly={true}
                                    className="border-0 shadow-none h-full"
                                />
                                {/* Overlay to ensure clicks don't work effectively if needed, though readOnly handles it */}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-200 min-h-0">
                            {/* Annexures View handles its own internal layout */}
                            <AnnexuresView
                                annexures={annexures}
                                onAnnexureChange={handleAnnexureChange}
                                onUpdate={() => { }} // Files handled internally or removed
                                onAdd={handleAddAnnexure}
                                onRemove={handleRemoveAnnexure}
                                onTitleChange={handleTitleChange}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
