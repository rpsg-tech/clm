"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
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
        <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300 ${className}`}>
            {/* Header - Hide if simple mode */}
            {!toolbarSimple && (
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4 bg-white">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${readOnly ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-600'}`}>
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900">{readOnly ? 'Main Agreement' : 'Contract Editor'}</h2>
                            {readOnly && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">READ ONLY</span>}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">{readOnly ? 'Standard Terms' : 'New Contract'}</span>
                            <p className="text-sm text-gray-500">{readOnly ? 'This content is fixed based on the selected template.' : 'Review and edit your contract.'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Editor */}
            <div className={`flex-1 overflow-hidden flex flex-col min-h-0 ${toolbarSimple ? 'bg-white p-4' : 'bg-gray-50/30 p-6'}`}>
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
                <div className="p-4 border-t border-gray-100 bg-white">
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
