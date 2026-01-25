
"use client";

import { useState } from "react";
import {
    Paperclip, Upload, X, File as FileIcon,
    Bold, Italic, Link as LinkIcon, Image as ImageIcon,
    List, Table as TableIcon, AlignLeft, AlignCenter, AlignRight,
    Loader2
} from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";

// Shared Types
export interface AnnexureItem {
    id: string;
    title: string;
    subtitle: string;
    content: string;
}

interface AnnexuresViewProps {
    annexures: AnnexureItem[];
    onAnnexureChange: (id: string, newContent: string) => void;
    onUpdate: (files: File[]) => void;
}

export function AnnexuresView({ annexures, onAnnexureChange, onUpdate }: AnnexuresViewProps) {
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

    return (
        <div className="flex h-[600px] border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm animate-in fade-in zoom-in-95 duration-300">
            {/* Sidebar - Annexure List */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50/50 flex flex-col">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Contract Annexures</h3>
                    <p className="text-xs text-gray-500 mt-1">Select an annexure to edit or upload.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {annexures.map((annexure) => (
                        <button
                            key={annexure.id}
                            onClick={() => handleAnnexureClick(annexure)}
                            className={`w-full text-left p-4 rounded-xl transition-all border ${activeAnnexureId === annexure.id
                                ? "bg-white border-orange-200 shadow-md shadow-orange-500/5 ring-1 ring-orange-100" // Active State
                                : "bg-transparent border-transparent hover:bg-white hover:border-gray-200"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activeAnnexureId === annexure.id ? "bg-orange-100 text-orange-600" : "bg-gray-200 text-gray-500"
                                    }`}>
                                    <Paperclip size={16} />
                                </div>
                                <div>
                                    <h4 className={`font-semibold text-sm ${activeAnnexureId === annexure.id ? "text-gray-900" : "text-gray-600"}`}>
                                        {annexure.title}
                                    </h4>
                                    <p className="text-xs text-gray-400">{annexure.subtitle}</p>
                                </div>
                            </div>
                        </button>
                    ))}

                    <div className="pt-4 mt-4 border-t border-gray-200/50">
                        <label
                            htmlFor="hidden-file-upload"
                            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all cursor-pointer group"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <Upload size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-semibold">Upload New Attachment</span>
                        </label>
                        <input type="file" id="hidden-file-upload" className="hidden" multiple onChange={handleFileSelect} />
                    </div>

                    {/* Display Uploaded Files */}
                    {files.length > 0 && (
                        <div className="space-y-2 mt-2">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 pl-3 bg-white border border-gray-200 rounded-lg text-xs">
                                    <span className="truncate max-w-[120px] text-gray-600 font-medium">{file.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content - Editor Area */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Editor Content (Real) */}
                <div className="flex-1 p-4 overflow-hidden flex flex-col bg-gray-50/20">
                    <RichTextEditor
                        value={activeAnnexure.content.replace(/\n/g, "<br/>")}
                        onChange={handleContentChange}
                        className="flex-1 shadow-sm border-gray-100 min-h-0"
                        placeholder="Start typing annexure content..."
                    />
                </div>

                {/* Editor Footer */}
                <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center text-xs text-gray-400">
                    <span>Last auto-saved just now</span>
                    <span>{activeAnnexure.content.length} chars</span>
                </div>
            </div>
        </div>
    );
}
