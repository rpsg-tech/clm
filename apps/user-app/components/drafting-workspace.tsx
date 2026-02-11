"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui";
import { ArrowLeft, ArrowRight, Settings, Minimize2, Maximize2, User, Calendar, CreditCard, Search, Check } from "lucide-react";
import { ContractEditorView } from "@/components/contract-editor-view";
import { AnnexureItem } from "@/components/annexures-view";
import { ContractNavigationSidebar } from "@/components/contract-navigation-sidebar";

interface DraftingWorkspaceProps {
    // Data
    contractDetails: any;
    editorContent: string;
    annexures: AnnexureItem[];
    attachedFiles: File[];
    templateName?: string;

    // State Flags
    startWithLaunchpad?: boolean;
    renderLaunchpad?: () => React.ReactNode;
    errors?: Record<string, string>;
    mainContentReadOnly?: boolean;
    filePreviewUrl?: string | null;
    isUploadedContract?: boolean; // Skip workflow enforcement for uploads

    // Handlers
    onValidate?: (field: string, value: any) => void;
    onDetailsChange: (data: any) => void;
    onEditorChange: (content: string) => void;
    onAnnexuresChange: (id: string, content: string) => void;
    onAnnexuresUpdate: (files: File[]) => void;
    onAddAnnexure: () => void;
    onRemoveAnnexure: (id: string) => void;
    onAnnexureTitleChange: (id: string, title: string) => void;
    onStepChange?: (step: 'main' | 'annexure') => void;
    onNext: () => void;
    onBack: () => void;
}

export function DraftingWorkspace({
    contractDetails,
    editorContent,
    annexures,
    attachedFiles,
    templateName,
    startWithLaunchpad = false,
    renderLaunchpad,
    errors = {},
    mainContentReadOnly = false,
    filePreviewUrl,
    isUploadedContract = false,
    onValidate,
    onDetailsChange,
    onEditorChange,
    onAnnexuresChange,
    onAnnexuresUpdate,
    onAddAnnexure,
    onRemoveAnnexure,
    onAnnexureTitleChange,
    onStepChange,
    onNext,
    onBack
}: DraftingWorkspaceProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Visit Tracking (same as Edit page)
    const [visitedAnnexures, setVisitedAnnexures] = useState<Set<string>>(new Set());
    const [activeDocId, setActiveDocId] = useState<string>('main');

    // Handle document selection with visit tracking
    const handleSelectDocument = (id: string) => {
        setActiveDocId(id);
        if (id !== 'main' && !visitedAnnexures.has(id)) {
            setVisitedAnnexures(prev => new Set([...prev, id]));
        }
    };

    // Simple Form Handler
    const handleDetailChange = (field: string, value: any) => {
        onDetailsChange({
            ...contractDetails,
            [field]: value
        });
    };

    // Navigation items (same structure as Edit page)
    const navItems = [
        { id: 'main', title: 'Main Agreement', type: 'main' as const },
        ...annexures.map(a => ({ id: a.id, title: a.title, type: 'annexure' as const }))
    ];

    // Skip workflow enforcement for uploaded contracts
    const skipWorkflowEnforcement = isUploadedContract;

    // Check if all annexures visited (or skip check for uploads)
    const allAnnexuresVisited = skipWorkflowEnforcement || annexures.length === 0 || annexures.every(a => visitedAnnexures.has(a.id));

    // Find active annexure
    const activeAnnexure = annexures.find(a => a.id === activeDocId);

    useEffect(() => {
        if (!onStepChange || startWithLaunchpad) return;
        onStepChange(activeDocId === 'main' ? 'main' : 'annexure');
    }, [activeDocId, onStepChange, startWithLaunchpad]);

    return (
        <div className="flex min-h-[500px] border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-2xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-500">
            {/* LEFT SIDEBAR: METADATA FORM */}
            <div className={`
                flex-shrink-0 border-r border-slate-200 bg-slate-50/50 transition-all duration-300 ease-in-out flex flex-col relative z-20
                ${sidebarOpen ? 'w-[320px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}
            `}>
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-sm">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                        <Settings className="w-4 h-4 text-slate-500" />
                        Contract Data
                    </h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSidebarOpen(false)}>
                        <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Title</label>
                        <input
                            type="text"
                            value={contractDetails.title || ""}
                            onChange={(e) => handleDetailChange("title", e.target.value)}
                            placeholder="Contract Title"
                            className={`w-full text-sm font-bold p-2.5 rounded-lg border bg-white outline-none focus:ring-2 transition-all shadow-sm ${errors.title
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                                }`}
                            disabled={false}
                        />
                        {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
                    </div>

                    {/* Counterparty */}
                    <div className="space-y-3 pt-2 border-t border-slate-200/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                            <User className="w-3.5 h-3.5" /> Counterparty
                        </div>
                        <input
                            type="text"
                            value={contractDetails.counterpartyName || ""}
                            onChange={(e) => handleDetailChange("counterpartyName", e.target.value)}
                            placeholder="Company or Individual Name"
                            className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-orange-500 shadow-sm"
                            disabled={false}
                        />
                    </div>

                    {/* Dates */}
                    <div className="space-y-3 pt-2 border-t border-slate-200/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                            <Calendar className="w-3.5 h-3.5" /> Timeline
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Start</label>
                                <input
                                    type="date"
                                    value={contractDetails.startDate || ""}
                                    onChange={(e) => handleDetailChange("startDate", e.target.value)}
                                    className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-orange-500 shadow-sm"
                                    disabled={false}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">End</label>
                                <input
                                    type="date"
                                    value={contractDetails.endDate || ""}
                                    onChange={(e) => handleDetailChange("endDate", e.target.value)}
                                    className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-orange-500 shadow-sm"
                                    disabled={false}
                                />
                            </div>
                            {errors.date && <p className="text-[10px] text-red-500 mt-1 col-span-2">{errors.date}</p>}
                        </div>
                    </div>

                    {/* Value */}
                    <div className="space-y-3 pt-2 border-t border-slate-200/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                            <CreditCard className="w-3.5 h-3.5" /> Value
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                            <input
                                type="number"
                                value={contractDetails.amount || ""}
                                onChange={(e) => handleDetailChange("amount", e.target.value)}
                                className="w-full text-sm p-2 pl-6 rounded-lg border border-slate-200 bg-white outline-none focus:border-orange-500 font-mono shadow-sm"
                                disabled={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* DOCUMENT NAVIGATION SIDEBAR (NEW) */}
            {!startWithLaunchpad && !filePreviewUrl && (
                <div className="w-[300px] border-r border-slate-200 bg-slate-50">
                    <ContractNavigationSidebar
                        items={navItems}
                        activeId={activeDocId}
                        visitedIds={visitedAnnexures}
                        skipWorkflowEnforcement={skipWorkflowEnforcement}
                        onSelect={handleSelectDocument}
                        onAddAnnexure={onAddAnnexure}
                        onRemoveAnnexure={onRemoveAnnexure}
                        className="h-full"
                    />
                </div>
            )}

            {/* MAIN CONTENT Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {/* Top Toolbar */}
                <div className="h-12 border-b border-slate-100 flex items-center justify-between px-3 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2 min-w-0">
                        {!sidebarOpen && (
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="mr-2 text-slate-400 hover:text-slate-600">
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                        )}
                        {!startWithLaunchpad && (
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 truncate">
                                <span className="px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                                    {activeDocId === 'main' ? 'Main Agreement' : (activeAnnexure?.title || 'Annexure')}
                                </span>
                            </div>
                        )}
                    </div>

                    {!startWithLaunchpad && (
                        <div className="flex items-center gap-2">
                            {!filePreviewUrl && (
                                <Button
                                    onClick={onBack}
                                    variant="ghost"
                                    className="text-slate-600 hover:text-slate-900 h-8 px-3 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                                    title="Change Template"
                                >
                                    <Search size={14} /> Change Template
                                </Button>
                            )}
                            <div className="flex items-center gap-2">

                                <Button
                                    onClick={onNext}
                                    disabled={!allAnnexuresVisited}
                                    className="bg-slate-900 hover:bg-orange-600 text-white font-bold uppercase text-[10px] tracking-wide h-8 px-4 rounded-full shadow-md shadow-slate-900/20 transition-all flex items-center gap-2 hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={!allAnnexuresVisited ? 'Review all annexures before proceeding' : 'Proceed to Final Review'}
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Final Review
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-hidden relative bg-white">
                    {startWithLaunchpad ? (
                        <div className="h-full w-full overflow-y-auto">
                            {renderLaunchpad && renderLaunchpad()}
                        </div>
                    ) : filePreviewUrl ? (
                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-4">
                            <div className="w-full h-full max-w-4xl bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200">
                                <iframe
                                    src={filePreviewUrl}
                                    className="w-full h-full"
                                    title="Document Preview"
                                />
                            </div>
                        </div>
                    ) : activeDocId === 'main' ? (
                        <ContractEditorView
                            content={editorContent}
                            onChange={onEditorChange}
                            className="h-full border-none shadow-none rounded-none"
                            toolbarSimple={true}
                            readOnly={mainContentReadOnly}
                        />
                    ) : activeAnnexure ? (
                        <div className="h-full flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annexure Title</label>
                                    <input
                                        type="text"
                                        value={activeAnnexure.title}
                                        onChange={(e) => onAnnexureTitleChange(activeAnnexure.id, e.target.value)}
                                        className="text-xl font-bold text-slate-900 placeholder-slate-300 border-none p-0 w-full focus:ring-0 bg-transparent"
                                        placeholder="Enter Title..."
                                    />
                                </div>
                            </div>
                            <ContractEditorView
                                content={activeAnnexure.content}
                                onChange={(val) => onAnnexuresChange(activeAnnexure.id, val)}
                                className="h-full border-none shadow-none rounded-none"
                                toolbarSimple={true}
                                readOnly={false}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">Document not found</div>
                    )}
                </div>
            </div>
        </div>
    );
}
