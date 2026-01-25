"use client";

import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";

interface ContractEditorViewProps {
    content: string;
    onChange: (content: string) => void;
    onContinue: () => void;
}

export function ContractEditorView({ content, onChange, onContinue }: ContractEditorViewProps) {
    // Preserve newlines handled by parent or RichTextEditor logic now


    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4 bg-white">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <FileText size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">Contract Editor</h2>
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">#</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">New Contract</span>
                        <p className="text-sm text-gray-500">Review and edit your contract. Fill in the blank sections marked with brackets.</p>
                    </div>
                </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col bg-gray-50/30">
                <RichTextEditor
                    value={content}
                    onChange={onChange}
                    className="flex-1 shadow-sm border-gray-200"
                    placeholder="Start typing your contract..."
                />
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <button
                    onClick={onContinue}
                    className="w-full flex items-center justify-center py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
                >
                    Continue to Add Annexures
                    <ArrowRight size={18} className="ml-2" />
                </button>
            </div>
        </div>
    );
}
