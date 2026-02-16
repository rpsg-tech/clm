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
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { EditorToolbar } from './editor-toolbar';
import { VariableExtension } from './extensions/variable-extension';
import { FloatingTableToolbar } from './menus/floating-table-toolbar';
import { SlashCommand } from './extensions/slash-command';
import { slashCommandSuggestion } from './extensions/slash-command-suggestion';
import { EditorBubbleMenu } from './menus/editor-bubble-menu';



export interface TipTapEditorRef {
    insertContent: (content: string) => void;
    getSelectedText: () => string;
    focus: () => void;
}

interface TipTapEditorProps {
    content: string;
    onChange: (content: string) => void;
    onSelectionChange?: (text: string) => void;
    editable?: boolean;
    className?: string;
    placeholder?: string;
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(({ content, onChange, onSelectionChange, editable = true, className = "", placeholder = "Start typing..." }, ref) => {
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
            TableHeader.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        backgroundColor: {
                            default: null,
                            parseHTML: element => element.getAttribute('data-background-color'),
                            renderHTML: attributes => {
                                if (!attributes.backgroundColor) {
                                    return {}
                                }
                                return {
                                    'data-background-color': attributes.backgroundColor,
                                    style: `background-color: ${attributes.backgroundColor}`,
                                }
                            },
                        },
                    }
                },
            }),
            TableCell.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        backgroundColor: {
                            default: null,
                            parseHTML: element => element.getAttribute('data-background-color'),
                            renderHTML: attributes => {
                                if (!attributes.backgroundColor) {
                                    return {}
                                }
                                return {
                                    'data-background-color': attributes.backgroundColor,
                                    style: `background-color: ${attributes.backgroundColor}`,
                                }
                            },
                        },
                    }
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
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
            Highlight.configure({ multicolor: true }),
            CharacterCount,
            VariableExtension, // Custom Variable Chip
            SlashCommand.configure({
                suggestion: slashCommandSuggestion as any,
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onSelectionUpdate: ({ editor }) => {
            if (onSelectionChange) {
                const selection = editor.state.doc.textBetween(
                    editor.state.selection.from,
                    editor.state.selection.to,
                    ' '
                );
                onSelectionChange(selection);
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none max-w-none min-h-full p-8 lg:p-12',
            },
        },
    });

    useImperativeHandle(ref, () => ({
        insertContent: (content: string) => {
            editor?.chain().focus().insertContent(content).run();
        },
        getSelectedText: () => {
            if (!editor) return "";
            return editor.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to,
                ' '
            );
        },
        focus: () => {
            editor?.chain().focus().run();
        }
    }));

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

    // Sync editable state
    useEffect(() => {
        if (editor) {
            editor.setEditable(editable);
        }
    }, [editable, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={`w-full flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden min-h-0 ${className}`}>
            {/* Fixed Toolbar */}
            {editable && (
                <div className="flex flex-col shrink-0">
                    <EditorToolbar editor={editor} />
                </div>
            )}

            {/* Floating Table Toolbar */}
            {editable && <FloatingTableToolbar editor={editor} />}

            {/* Bubble Menu for Text Selection */}
            {editable && <EditorBubbleMenu editor={editor} />}

            {/* Editor Surface */}
            <div className="flex-1 overflow-y-auto w-full relative">
                <EditorContent editor={editor} className="min-h-full" />
            </div>

            <div className="py-2 px-6 text-xs text-slate-400 font-mono flex justify-between items-center border-t border-slate-100 bg-white">
                <div className="flex gap-4">
                    <span>{editor.storage.characterCount.characters()} characters</span>
                    <span>{editor.storage.characterCount.words()} words</span>
                    {onSelectionChange && <span>Selection Active</span>}
                </div>
                <span>Pro Tip: Type '/' for commands</span>
            </div>
        </div>
    );
});

TipTapEditor.displayName = 'TipTapEditor';
