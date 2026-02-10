"use client";

import { useState, useRef } from "react";
import {
    List, Plus, Trash2, ChevronDown, ChevronUp, Maximize2, Minimize2
} from "lucide-react";
import { ContractEditorView } from "@/components/contract-editor-view";

// Shared Types
export interface AnnexureItem {
    id: string;
    title: string;
    content: string;
}

interface AnnexuresViewProps {
    annexures: AnnexureItem[];
    onAnnexureChange: (id: string, newContent: string) => void;
    onUpdate: (files: File[]) => void;
    onAdd: () => void;
    onRemove: (id: string) => void;
    onTitleChange: (id: string, title: string) => void;
}

export function AnnexuresView({ annexures, onAnnexureChange, onUpdate, onAdd, onRemove, onTitleChange }: AnnexuresViewProps) {
    const [activeAnnexureId, setActiveAnnexureId] = useState<string>(annexures[0]?.id || "");
    const [isMaximized, setIsMaximized] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Sync active ID if annexures change and active is gone
    if (activeAnnexureId && !annexures.find(a => a.id === activeAnnexureId) && annexures.length > 0) {
        setActiveAnnexureId(annexures[0].id);
    }

    const activeAnnexure = annexures.find(a => a.id === activeAnnexureId);

    // Auto-scroll to active tab logic could be added here

    return (
        <div className={`
            flex flex-col border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-300
            ${isMaximized
                ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
                : 'h-[700px] rounded-2xl relative animate-in fade-in zoom-in-95'}
        `}>

            {/* Top Bar: Tabs (Hidden in Focus Mode) */}
            {!isMaximized && (
                <div className="flex items-center bg-slate-50 border-b border-slate-200 px-2 h-12 flex-shrink-0">
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth pr-2"
                    >
                        {annexures.map((annexure, index) => {
                            const isActive = activeAnnexureId === annexure.id;
                            return (
                                <div
                                    key={annexure.id}
                                    onClick={() => setActiveAnnexureId(annexure.id)}
                                    className={`
                                        group relative flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all duration-200 border-b-2 border-transparent hover:bg-white min-w-[140px] max-w-[200px] h-full mt-1
                                        ${isActive
                                            ? 'bg-white text-orange-600 border-orange-500 font-medium shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                                            : 'text-slate-500 hover:text-slate-700'
                                        }
                                    `}
                                >
                                    <span className={`
                                        text-[10px] font-bold px-1.5 py-0.5 rounded
                                        ${isActive ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-500'}
                                    `}>
                                        {index + 1}
                                    </span>
                                    <span className="text-xs truncate flex-1 block select-none">
                                        {annexure.title || "Untitled"}
                                    </span>

                                    {/* Close Button (visible on hover or active) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove(annexure.id);
                                        }}
                                        disabled={annexures.length <= 1}
                                        className={`
                                            p-1 rounded-full hover:bg-rose-100 hover:text-rose-500 transition-opacity
                                            ${isActive ? 'opacity-100 text-slate-400' : 'opacity-0 group-hover:opacity-100 text-slate-300'}
                                            ${annexures.length <= 1 ? 'hidden' : ''}
                                        `}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            );
                        })}

                        {/* Add Button inline with tabs */}
                        <button
                            onClick={onAdd}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-orange-50 hover:text-orange-600 text-slate-400 transition-colors ml-1 flex-shrink-0"
                            title="Add New Annexure"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main: Editor Area */}
            <div className="flex-1 flex flex-col bg-white min-w-0 min-h-0">
                {activeAnnexure ? (
                    <>
                        {/* Editor Header (Title Input) */}
                        <div className="px-8 py-5 border-b border-slate-50 bg-white flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Annexure Title
                                </label>
                                <input
                                    type="text"
                                    value={activeAnnexure.title}
                                    onChange={(e) => onTitleChange(activeAnnexure.id, e.target.value)}
                                    className="text-2xl font-bold text-slate-900 placeholder-slate-300 border-none p-0 w-full focus:ring-0 bg-transparent"
                                    placeholder="Enter Annexure Title..."
                                />
                            </div>

                            {/* Focus Mode Toggle */}
                            <button
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2 group"
                                title={isMaximized ? "Exit Focus Mode" : "Enter Focus Mode"}
                            >
                                {isMaximized ? (
                                    <>
                                        <Minimize2 size={20} />
                                        <span className="text-xs font-semibold">Exit Focus</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Focus Mode</span>
                                        <Maximize2 size={20} />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Editor Content */}
                        {/* In maximized mode, use a different background or padding to ensure readability */}
                        <div className={`flex-1 overflow-hidden flex flex-col min-h-0 ${isMaximized ? 'bg-slate-50' : 'bg-slate-50/30'}`}>
                            <div className={`h-full ${isMaximized ? 'max-w-4xl mx-auto w-full py-8' : 'px-8 py-6'}`}>
                                <div className="bg-white border border-slate-100 rounded-xl shadow-sm h-full overflow-hidden">
                                    <ContractEditorView
                                        content={activeAnnexure.content}
                                        onChange={(val: string) => onAnnexureChange(activeAnnexure.id, val)}
                                        className="border-none shadow-none rounded-none h-full"
                                        toolbarSimple={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                            <List size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No Annexure Selected</h3>
                        <p className="text-sm text-slate-500 max-w-xs mt-2">Select an annexure tab above or create a new one.</p>
                        <button onClick={onAdd} className="mt-6 px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-orange-600 transition-colors">
                            Create New Annexure
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
