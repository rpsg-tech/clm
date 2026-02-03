"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { ArrowLeft, ArrowRight, FileText, Settings, Paperclip, Minimize2, Maximize2, User, Calendar, CreditCard, LayoutDashboard, Search } from "lucide-react";
import { ContractEditorView } from "@/components/contract-editor-view";
import { AnnexuresView, AnnexureItem } from "@/components/annexures-view";

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

    // Handlers
    onValidate?: (field: string, value: any) => void;
    onDetailsChange: (data: any) => void;
    onEditorChange: (content: string) => void;
    onAnnexuresChange: (id: string, content: string) => void;
    onAnnexuresUpdate: (files: File[]) => void;
    onAddAnnexure: () => void;
    onRemoveAnnexure: (id: string) => void;
    onAnnexureTitleChange: (id: string, title: string) => void;
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
    onValidate,
    onDetailsChange,
    onEditorChange,
    onAnnexuresChange,
    onAnnexuresUpdate,
    onAddAnnexure,
    onRemoveAnnexure,
    onAnnexureTitleChange,
    onNext,
    onBack
}: DraftingWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<"editor" | "annexures">("editor");
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Simple Form Handler
    const handleDetailChange = (field: string, value: any) => {
        onDetailsChange({
            ...contractDetails,
            [field]: value
        });
    };

    return (
        <div className="flex h-[calc(100vh-140px)] min-h-[600px] border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-2xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-500">
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
                            onBlur={(e) => onValidate?.("title", e.target.value)}
                        />
                        {errors.title && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.title}</p>}
                    </div>

                    {/* Counterparty */}
                    <div className="space-y-3 pt-2 border-t border-slate-200/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                            <User className="w-3.5 h-3.5" /> Counterparty
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Entity Name</label>
                            <input
                                type="text"
                                value={contractDetails.counterpartyName || ""}
                                onChange={(e) => handleDetailChange("counterpartyName", e.target.value)}
                                className={`w-full text-sm p-2 rounded-lg border bg-white outline-none shadow-sm ${errors.counterpartyName
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-slate-200 focus:border-orange-500"
                                    }`}
                                disabled={false}
                                onBlur={(e) => onValidate?.("counterpartyName", e.target.value)}
                            />
                            {errors.counterpartyName && <p className="text-[10px] text-red-500 mt-1">{errors.counterpartyName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Email</label>
                            <input
                                type="email"
                                value={contractDetails.counterpartyEmail || ""}
                                onChange={(e) => handleDetailChange("counterpartyEmail", e.target.value)}
                                className={`w-full text-sm p-2 rounded-lg border bg-white outline-none shadow-sm ${errors.counterpartyEmail
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-slate-200 focus:border-orange-500"
                                    }`}
                                disabled={false}
                                onBlur={(e) => onValidate?.("counterpartyEmail", e.target.value)}
                            />
                            {errors.counterpartyEmail && <p className="text-[10px] text-red-500 mt-1">{errors.counterpartyEmail}</p>}
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="space-y-3 pt-2 border-t border-slate-200/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                            <Calendar className="w-3.5 h-3.5" /> Terms
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Start</label>
                                <input
                                    type="date"
                                    value={contractDetails.startDate ? new Date(contractDetails.startDate).toISOString().split('T')[0] : ""}
                                    onChange={(e) => handleDetailChange("startDate", e.target.value)}
                                    className={`w-full text-xs p-2 rounded-lg border bg-white outline-none shadow-sm ${errors.date
                                        ? "border-red-500 focus:border-red-500"
                                        : "border-slate-200 focus:border-orange-500"
                                        }`}
                                    disabled={false}
                                    onBlur={(e) => onValidate?.("startDate", e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">End</label>
                                <input
                                    type="date"
                                    value={contractDetails.endDate ? new Date(contractDetails.endDate).toISOString().split('T')[0] : ""}
                                    onChange={(e) => handleDetailChange("endDate", e.target.value)}
                                    className={`w-full text-xs p-2 rounded-lg border bg-white outline-none shadow-sm ${errors.date
                                        ? "border-red-500 focus:border-red-500"
                                        : "border-slate-200 focus:border-orange-500"
                                        }`}
                                    disabled={false}
                                    onBlur={(e) => onValidate?.("endDate", e.target.value)}
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

            {/* MAIN CONTENT Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {/* Top Toolbar */}
                <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        {!sidebarOpen && (
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="mr-2 text-slate-400 hover:text-slate-600">
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                        )}
                        {!startWithLaunchpad && !filePreviewUrl && (
                            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                                <button
                                    onClick={() => setActiveTab("editor")}
                                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all flex items-center gap-2
                                        ${activeTab === "editor" ? "bg-white shadow-sm text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-900"}
                                    `}
                                >
                                    <FileText className="w-3.5 h-3.5" /> Agreement
                                </button>
                                <button
                                    onClick={() => setActiveTab("annexures")}
                                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all flex items-center gap-2
                                        ${activeTab === "annexures" ? "bg-white shadow-sm text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-900"}
                                    `}
                                >
                                    <Paperclip className="w-3.5 h-3.5" /> Annexures ({annexures.length})
                                </button>
                            </div>
                        )}
                        {filePreviewUrl && (
                            <div className="flex items-center gap-2 px-2">
                                <FileText className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-bold text-slate-900 tracking-tight">Review Document</span>
                            </div>
                        )}
                        {startWithLaunchpad && (
                            <div className="flex items-center gap-2 px-2">
                                <LayoutDashboard className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-bold text-slate-900 tracking-tight">Workspace Ready</span>
                            </div>
                        )}
                    </div>

                    {!startWithLaunchpad && (
                        <div className="flex gap-2">
                            {!filePreviewUrl && (
                                <Button
                                    onClick={onBack}
                                    variant="ghost"
                                    className="text-slate-400 hover:text-slate-700 h-8 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide"
                                    title="Change Template"
                                >
                                    <Search size={14} /> Change Template
                                </Button>
                            )}
                            <Button
                                onClick={onNext}
                                className="bg-slate-900 hover:bg-orange-600 text-white font-bold uppercase text-[10px] tracking-wide h-8 px-4 rounded-lg shadow-md transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/20"
                            >
                                Final Review <ArrowRight size={14} />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-hidden relative bg-slate-50/30">
                    {startWithLaunchpad ? (
                        <div className="h-full w-full overflow-y-auto">
                            {renderLaunchpad && renderLaunchpad()}
                        </div>
                    ) : (
                        <>
                            <div className={`h-full flex flex-col ${activeTab === "editor" ? "block" : "hidden"}`}>
                                <div className="flex-1 overflow-y-auto h-full">
                                    {filePreviewUrl ? (
                                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-4">
                                            <div className="w-full h-full max-w-4xl bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200">
                                                <iframe
                                                    src={filePreviewUrl}
                                                    className="w-full h-full"
                                                    title="Document Preview"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <ContractEditorView
                                            content={editorContent}
                                            onChange={onEditorChange}
                                            className="border-0 shadow-none rounded-none min-h-full"
                                            toolbarSimple={true}
                                            readOnly={mainContentReadOnly}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className={`h-full overflow-y-auto p-6 ${activeTab === "annexures" ? "block" : "hidden"}`}>
                                <AnnexuresView
                                    annexures={annexures}
                                    onAnnexureChange={onAnnexuresChange}
                                    onUpdate={onAnnexuresUpdate}
                                    onAdd={onAddAnnexure}
                                    onRemove={onRemoveAnnexure}
                                    onTitleChange={onAnnexureTitleChange}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
