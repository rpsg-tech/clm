
import React from 'react';
import { TipTapEditor } from '@/components/editor/tip-tap-editor';
import { MaterialIcon } from '@/components/ui/material-icon';

interface PartBEditorProps {
    content: string;
    onChange: (content: string) => void;
}

export const PartBEditor: React.FC<PartBEditorProps> = ({ content, onChange }) => {
    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary-700">
                    <MaterialIcon name="edit" className="w-4 h-4" />
                    <span className="font-semibold text-sm uppercase tracking-wide">Annexures (Part B)</span>
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Editable
                </span>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {/* We reuse the existing TipTapEditor but might want to customize toolbar later */}
                <TipTapEditor
                    content={content}
                    onChange={onChange}
                    editable={true}
                    className="h-full overflow-y-auto p-4"
                />
            </div>
        </div>
    );
};
