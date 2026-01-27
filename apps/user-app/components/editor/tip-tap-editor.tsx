"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect } from 'react';
import { EditorToolbar } from './editor-toolbar';
import { VariableExtension } from './extensions/variable-extension';

interface TipTapEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
    className?: string;
    placeholder?: string;
}

export function TipTapEditor({ content, onChange, editable = true, className = "", placeholder = "Start typing..." }: TipTapEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder,
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-slate-400 before:float-left before:pointer-events-none',
            }),
            Typography,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
            TextStyle,
            FontFamily,
            Color,
            Underline,
            Subscript,
            Superscript,
            CharacterCount,
            VariableExtension, // Custom Variable Chip
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none max-w-none min-h-[800px] p-8 lg:p-12',
            },
        },
    });

    const insertVariable = (label: string) => {
        editor?.chain().focus().insertContent({
            type: 'variable',
            attrs: { label }
        }).run();
    };

    // Update content if it changes externally (e.g. template selection)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={`w-full flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
            {/* Fixed Toolbar */}
            {editable && (
                <div className="flex flex-col">
                    <EditorToolbar editor={editor} />
                    {/* Variable Toolbar (Quick Insert) */}
                    <div className="flex gap-2 p-2 bg-slate-50 border-b border-slate-100 text-xs overflow-x-auto">
                        <span className="text-slate-400 font-bold uppercase tracking-wider py-1">Insert Vars:</span>
                        <button onClick={() => insertVariable('Counterparty Name')} className="px-2 py-1 bg-white border border-slate-200 rounded-md hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm">
                            Client Name
                        </button>
                        <button onClick={() => insertVariable('Effective Date')} className="px-2 py-1 bg-white border border-slate-200 rounded-md hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm">
                            Date
                        </button>
                        <button onClick={() => insertVariable('Total Amount')} className="px-2 py-1 bg-white border border-slate-200 rounded-md hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm">
                            Amount
                        </button>
                    </div>
                </div>
            )}

            {/* Editor Surface */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            <div className="py-2 px-6 text-xs text-slate-400 font-mono flex justify-between items-center border-t border-slate-100 bg-white">
                <div className="flex gap-4">
                    <span>{editor.storage.characterCount.characters()} characters</span>
                    <span>{editor.storage.characterCount.words()} words</span>
                </div>
                <span>Pro Tip: Type '/' for commands</span>
            </div>
        </div>
    );
}
