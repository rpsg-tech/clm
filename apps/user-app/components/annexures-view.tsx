"use client";

import { useState, useRef } from "react";
import {
    Paperclip, Upload, X, File as FileIcon,
    Bold, Italic, Link as LinkIcon, Image as ImageIcon,
    List, Table as TableIcon, AlignLeft, AlignCenter, AlignRight,
    Loader2, Plus, Trash2, ChevronDown, ChevronUp
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
    const [files, setFiles] = useState<File[]>([]);
    const [activeAnnexureId, setActiveAnnexureId] = useState<string>("annex-a");
    const [isDragging, setIsDragging] = useState(false);

    // Find active annexure from props
    const activeAnnexure = annexures.find(a => a.id === activeAnnexureId) || annexures[0];

    // Local handler to update parent state
    const handleContentChange = (newContent: string) => {
        onAnnexureChange(activeAnnexureId, newContent);
    };

    const handleAnnexureClick = (annexure: AnnexureItem) => {
        setActiveAnnexureId(annexure.id);
        // Content sync is handled by parent state now
    };

    // File Upload Handlers (preserved)
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => { setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) {
            const newFiles = [...files, ...Array.from(e.dataTransfer.files)];
            setFiles(newFiles);
            onUpdate(newFiles);
        }
    };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const newFiles = [...files, ...Array.from(e.target.files)];
            setFiles(newFiles);
            onUpdate(newFiles);
        }
    };
    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        onUpdate(newFiles);
    };

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([annexures[0]?.id]));

    // Auto-expand new items
    const prevCount = useRef(annexures.length);
    if (annexures.length > prevCount.current) {
        const newId = annexures[annexures.length - 1].id;
        if (!expandedIds.has(newId)) {
            const newSet = new Set(expandedIds);
            newSet.add(newId);
            setExpandedIds(newSet);
        }
        prevCount.current = annexures.length;
    }

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Annexure List */}
            <div className="space-y-8">
                {annexures.map((annexure, index) => {
                    const isExpanded = expandedIds.has(annexure.id);
                    return (
                        <div key={annexure.id} className="border border-slate-200 rounded-xl overflow-hidden group hover:border-orange-200 transition-colors bg-white shadow-sm">
                            {/* Header / Title Edit */}
                            <div
                                className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => toggleExpand(annexure.id)}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                        <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 shadow-sm">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={annexure.title}
                                            onChange={(e) => onTitleChange(annexure.id, e.target.value)}
                                            className="bg-transparent border-none p-0 text-base font-bold text-slate-900 focus:ring-0 placeholder-slate-400 w-full"
                                            placeholder="Annexure Title (e.g. Scope of Work)"
                                        />

                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {annexures.length > 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRemove(annexure.id); }}
                                            className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Remove Annexure"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Editor Area - Collapsible */}
                            {isExpanded && (
                                <div className="p-0 animate-in slide-in-from-top-2 duration-200">
                                    <ContractEditorView
                                        content={annexure.content}
                                        onChange={(val: string) => onAnnexureChange(annexure.id, val)}
                                        className="border-none shadow-none rounded-none min-h-[400px]"
                                        toolbarSimple={true}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add Button */}
                <button
                    onClick={onAdd}
                    className="w-full py-6 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50/50 transition-all group font-medium text-base"
                >
                    <Plus size={20} className="group-hover:scale-110 transition-transform" />
                    Add New Annexure
                </button>
            </div>

            {/* Global Attachments */}
            <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Paperclip size={16} className="text-orange-600" />
                    Additional Attachments
                </h3>

                <div className="space-y-4">
                    {/* File List */}
                    {files.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm group hover:border-orange-200 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-100 text-slate-400">
                                            <FileIcon size={14} />
                                        </div>
                                        <span className="truncate text-slate-700 font-medium">{file.name}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <label
                        htmlFor="hidden-file-upload"
                        className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all cursor-pointer group"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                            <Upload size={20} />
                        </div>
                        <span className="text-sm font-bold">Click to upload or drag and drop</span>
                        <span className="text-xs text-slate-400 mt-1">PDF, DOCX, IMG up to 10MB</span>
                    </label>
                    <input type="file" id="hidden-file-upload" className="hidden" multiple onChange={handleFileSelect} />
                </div>
            </div>
        </div>
    );
}
