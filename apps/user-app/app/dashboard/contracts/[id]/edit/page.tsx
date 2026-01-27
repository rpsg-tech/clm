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
    const [showAiPanel, setShowAiPanel] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Data States
    const [contract, setContract] = useState<Contract | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');
    const [selectedText, setSelectedText] = useState('');

    useEffect(() => {
        loadData();
    }, [contractId]);

    // Track text selection for AI assistant
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) {
                setSelectedText(selection.toString());
            }
        };

        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    }, []);

    const loadData = async () => {
        try {
            const contractData = await api.contracts.get(contractId);
            const c = contractData as Contract;
            setContract(c);
            setTitle(c.title);
            setContent(c.annexureData || '');

            // Set latest version as selected if exists
            if (c.versions && c.versions.length > 0) {
                const latest = c.versions.sort((a, b) => b.version - a.version)[0];
                setSelectedVersionId(latest.id);
            }
        } catch (err) {
            console.error('Failed to load data', err);
            toastError('Error', 'Failed to load contract data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (silent = false) => {
        if (!contract) return;
        setIsSaving(true);
        try {
            await api.contracts.update(contract.id, {
                title,
                annexureData: content
            });
            if (!silent) success('Saved', 'Contract updated successfully');
        } catch (err) {
            console.error('Save failed', err);
            toastError('Error', 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInsertClause = (text: string) => {
        setContent(prev => prev + '<p>' + text + '</p>');
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
    if (!contract) return <div className="text-center py-12">Contract not found</div>;

    const currentVersion = contract.versions?.find(v => v.id === selectedVersionId);

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] -m-4 bg-neutral-50 overflow-hidden relative">
            {/* 1. Glassmorphism Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200 px-6 py-4 flex items-center justify-between shrink-0 z-50 sticky top-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-neutral-500 hover:bg-neutral-100 rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-neutral-900 tracking-tight">{title || 'Untitled Contract'}</span>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border-neutral-300 text-neutral-600">
                                {contract.status.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                            <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">{contract.reference}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {contract.counterpartyName || 'External Counterparty'}
                            </span>
                            <span>•</span>
                            <span>Last saved: {isSaving ? 'Saving...' : 'Just now'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-neutral-100 rounded-lg p-1 mr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-3 text-xs gap-2 ${showAiPanel ? 'bg-white shadow-sm text-primary-700' : 'text-neutral-500'}`}
                            onClick={() => setShowAiPanel(true)}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Assistant
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-3 text-xs gap-2 ${!showAiPanel ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'}`}
                            onClick={() => setShowAiPanel(false)}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Focus Mode
                        </Button>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => handleSave(false)} className="h-9">
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                    </Button>

                    {/* Submit Action */}
                    {(contract.status === 'DRAFT' || contract.status === 'REJECTED') && (
                        <Button
                            size="sm"
                            className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20 h-9"
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    // Simulation of submitting to legal
                                    await new Promise(r => setTimeout(r, 800));
                                    success('Submitted', 'Contract sent for Legal Review');
                                    router.push(`/dashboard/contracts/${contractId}`);
                                } catch (e) { toastError('Error', 'Failed to submit'); }
                                setIsSaving(false);
                            }}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Submit for Review
                        </Button>
                    )}
                </div>
            </header>

            {/* 2. Main Workspace */}
            <div className="flex-1 flex min-h-0 overflow-hidden bg-neutral-100">

                {/* Editor Surface */}
                <main className="flex-1 relative flex flex-col min-w-0 transition-all duration-300">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <TipTapEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Start drafting your contract here..."
                            className="h-full border-0 rounded-none"
                        />
                    </div>


                    {/* Focus Mode Toggle (Visible when AI Panel is hidden) */}
                    {!showAiPanel && (
                        <div className="absolute right-6 top-6 z-30">
                            <Button
                                className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 shadow-lg rounded-full h-12 w-12 p-0 flex items-center justify-center group transition-all"
                                onClick={() => setShowAiPanel(true)}
                                title="Open AI Assistant"
                            >
                                <Sparkles className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
                            </Button>
                        </div>
                    )}
                </main>

                {/* Right Sidebar - AI Assistant */}
                <aside
                    className={`
                        bg-white border-l border-neutral-200 shadow-xl z-10 flex flex-col transition-all duration-300 ease-in-out
                        ${showAiPanel ? 'w-96 translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0 overflow-hidden'}
                    `}
                >
                    <div className="h-full flex flex-col min-w-[24rem]">
                        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white shrink-0">
                            <div className="flex items-center gap-2 text-primary-700 font-semibold">
                                <Sparkles className="w-5 h-5" />
                                <span>AI Legal Assistant</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowAiPanel(false)} className="h-8 w-8 hover:bg-white/50">
                                <PanelRightClose className="w-4 h-4 text-primary-700" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <AiClauseAssistant
                                isOpen={true}
                                onClose={() => { }} // Controlled by parent sidebar
                                onInsertClause={handleInsertClause}
                                selectedText={selectedText}
                                embedded={true}
                            />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
