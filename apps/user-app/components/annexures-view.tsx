"use client";

import { useState, useRef } from "react";
import {
    List, Plus, Trash2, ChevronDown, ChevronUp
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
    // Unused file upload state removed

    const [activeAnnexureId, setActiveAnnexureId] = useState<string>(annexures[0]?.id || "");

    // Sync active ID if annexures change and active is gone
    if (activeAnnexureId && !annexures.find(a => a.id === activeAnnexureId) && annexures.length > 0) {
        setActiveAnnexureId(annexures[0].id);
    }

    const activeAnnexure = annexures.find(a => a.id === activeAnnexureId);

    return (
        <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x divide-slate-100">
                {/* Sidebar: List of Annexures */}
                <div className="col-span-3 bg-slate-50 flex flex-col min-w-0">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            Annexures <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{annexures.length}</span>
                        </h3>
                        <button
                            onClick={onAdd}
                            className="p-1.5 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded-lg transition-colors"
                            title="Add New Annexure"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {annexures.map((annexure, index) => (
                            <div
                                key={annexure.id}
                                onClick={() => setActiveAnnexureId(annexure.id)}
                                className={`
                                    group flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all duration-200
                                    ${activeAnnexureId === annexure.id
                                        ? 'bg-white border-orange-200 shadow-sm ring-1 ring-orange-100'
                                        : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'}
                                `}
                            >
                                <span className={`
                                    flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors
                                    ${activeAnnexureId === annexure.id
                                        ? 'bg-orange-50 border-orange-100 text-orange-700'
                                        : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'}
                                `}>
                                    {index + 1}
                                </span>

                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-semibold truncate ${activeAnnexureId === annexure.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {annexure.title || "Untitled Annexure"}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                        ID: {annexure.id.slice(-6)}
                                    </p>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(annexure.id);
                                    }}
                                    className={`
                                        opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all
                                        ${activeAnnexureId === annexure.id ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}
                                    `}
                                    disabled={annexures.length <= 1}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={onAdd}
                            className="w-full py-3 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50/50 transition-all mt-4"
                        >
                            <Plus size={14} /> Add Another
                        </button>
                    </div>
                </div>

                {/* Main: Editor Area */}
                <div className="col-span-9 flex flex-col bg-white min-w-0 min-h-0">
                    {activeAnnexure ? (
                        <>
                            <div className="px-8 py-6 border-b border-slate-100 bg-white">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Annexure Title</label>
                                <input
                                    type="text"
                                    value={activeAnnexure.title}
                                    onChange={(e) => onTitleChange(activeAnnexure.id, e.target.value)}
                                    className="text-2xl font-bold text-slate-900 placeholder-slate-300 border-none p-0 w-full focus:ring-0 bg-transparent"
                                    placeholder="Enter Title..."
                                />
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                                <ContractEditorView
                                    content={activeAnnexure.content}
                                    onChange={(val: string) => onAnnexureChange(activeAnnexure.id, val)}
                                    className="border-none shadow-none rounded-none h-full"
                                    toolbarSimple={true}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                                <List size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No Annexure Selected</h3>
                            <p className="text-sm text-slate-500 max-w-xs mt-2">Select an annexure from the sidebar or create a new one to start editing.</p>
                            <button onClick={onAdd} className="mt-6 px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-orange-600 transition-colors">
                                Create New Annexure
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
