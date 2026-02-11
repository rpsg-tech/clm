"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import { ArrowLeft, ArrowRight, FileText, Lock } from "lucide-react";
import { TipTapEditor, TipTapEditorRef } from "@/components/editor/tip-tap-editor";

interface ContractEditorViewProps {
    content: string;
    onChange: (content: string) => void;
    onContinue?: () => void;
    onSelectionChange?: (text: string) => void;
    className?: string;
    toolbarSimple?: boolean;
    readOnly?: boolean;
}

export interface ContractEditorRef {
    insertContent: (content: string) => void;
    getSelectedText: () => string;
}

export const ContractEditorView = forwardRef<ContractEditorRef, ContractEditorViewProps>(({ content, onChange, onContinue, onSelectionChange, className = "", toolbarSimple = false, readOnly = false }, ref) => {
    // Preserve newlines handled by parent or RichTextEditor logic now
    const editorRef = useRef<TipTapEditorRef>(null);

    useImperativeHandle(ref, () => ({
        insertContent: (content: string) => {
            editorRef.current?.insertContent(content);
        },
        getSelectedText: () => {
            return editorRef.current?.getSelectedText() || "";
        }
    }));

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Read-Only Banner (Main Agreement) */}
            {!toolbarSimple && readOnly && (
                <div className="bg-slate-50 border-l-4 border-slate-400 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Lock size={16} className="text-slate-500" />
                        Main Agreement (Template Content)
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        This content is fixed based on your selected template and cannot be edited. You can modify the annexures instead.
                    </p>
                </div>
            )}

            {/* Header - Only for editable annexures */}
            {!toolbarSimple && !readOnly && (
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600">
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900">Annexure Editor</h2>
                        </div>
                        <p className="text-sm text-slate-500">Review and edit this annexure content.</p>
                    </div>
                </div>
            )}

            {/* Main Editor - Clean, No Boxes */}
            <div className={`flex-1 overflow-hidden flex flex-col min-h-0 ${readOnly ? 'bg-slate-50/30' : 'bg-white'} ${toolbarSimple ? 'p-0' : 'p-6'}`}>
                <TipTapEditor
                    ref={editorRef}
                    content={content}
                    onChange={onChange}
                    onSelectionChange={onSelectionChange}
                    editable={!readOnly}
                    className="h-full"
                />
            </div>

            {/* Footer Action - Hide if simple mode or no handler */}
            {!toolbarSimple && onContinue && (
                <div className="p-4 border-t border-slate-200 bg-white">
                    <button
                        onClick={onContinue}
                        className="w-full flex items-center justify-center py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
                    >
                        Continue to Add Annexures
                        <ArrowRight size={18} className="ml-2" />
                    </button>
                </div>
            )}
        </div>
    );
});

ContractEditorView.displayName = 'ContractEditorView';
