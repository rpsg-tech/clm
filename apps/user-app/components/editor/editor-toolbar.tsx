"use client";

import React, { useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { TableBuilder } from './menus/table-builder';
import { KeyboardShortcutsHelp } from './menus/keyboard-shortcuts-help';
import {
    Bold, Italic, Strikethrough, Underline, Code,
    List, ListOrdered, Quote, Minus, Undo, Redo,
    Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
    Subscript as SubIcon, Superscript as SuperIcon,
    Merge, Split, Scissors, Keyboard
} from 'lucide-react';

interface EditorToolbarProps {
    editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showTableBuilder, setShowTableBuilder] = useState(false);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const tableButtonRef = useRef<HTMLButtonElement>(null);

    if (!editor) {
        return null;
    }

    const ToggleButton = ({
        isActive,
        onClick,
        children,
        title,
        className = ""
    }: {
        isActive?: boolean;
        onClick: () => void;
        children: React.ReactNode;
        title?: string;
        className?: string;
    }) => (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-all ${isActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                } ${className}`}
            type="button"
        >
            {children}
        </button>
    );

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const src = e.target?.result as string;
                editor.chain().focus().setImage({ src }).run();
            };
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    };

    const addLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    // Heading Logic
    const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'p') {
            editor.chain().focus().setParagraph().run();
        } else if (value.startsWith('h')) {
            const level = parseInt(value.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6;
            editor.chain().focus().toggleHeading({ level }).run();
        }
    };

    const getCurrentHeadingValue = () => {
        if (editor.isActive('heading', { level: 1 })) return 'h1';
        if (editor.isActive('heading', { level: 2 })) return 'h2';
        if (editor.isActive('heading', { level: 3 })) return 'h3';
        if (editor.isActive('heading', { level: 4 })) return 'h4';
        if (editor.isActive('heading', { level: 5 })) return 'h5';
        if (editor.isActive('heading', { level: 6 })) return 'h6';
        return 'p';
    };

    // Alignment Logic
    const handleAlignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        editor.chain().focus().setTextAlign(value).run();
    };

    const getCurrentAlignValue = () => {
        if (editor.isActive({ textAlign: 'center' })) return 'center';
        if (editor.isActive({ textAlign: 'right' })) return 'right';
        if (editor.isActive({ textAlign: 'justify' })) return 'justify';
        return 'left';
    };

    // Font Family Logic
    const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'inter') {
            editor.chain().focus().unsetFontFamily().run();
        } else {
            editor.chain().focus().setFontFamily(value).run();
        }
    };

    const getCurrentFontValue = () => {
        if (editor.isActive('textStyle', { fontFamily: 'serif' })) return 'serif';
        if (editor.isActive('textStyle', { fontFamily: 'monospace' })) return 'monospace';
        if (editor.isActive('textStyle', { fontFamily: 'cursive' })) return 'cursive';
        return 'inter';
    };

    // Color Logic with Safety Check
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        editor.chain().focus().setColor(e.target.value).run();
    };

    return (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10 w-full shadow-sm">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />

            {/* History */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
                <ToggleButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Cmd+Z)">
                    <Undo size={16} />
                </ToggleButton>
                <ToggleButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Cmd+Shift+Z)">
                    <Redo size={16} />
                </ToggleButton>
            </div>

            {/* Typography */}
            <div className="flex items-center px-1 border-r border-slate-200 gap-2 mr-1">
                <select
                    value={getCurrentHeadingValue()}
                    onChange={handleHeadingChange}
                    className="h-8 px-2 text-sm bg-transparent border border-gray-200 rounded hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-100 cursor-pointer text-slate-700 font-medium w-28"
                    title="Heading Level"
                >
                    <option value="p">Normal Text</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="h4">Heading 4</option>
                    <option value="h5">Heading 5</option>
                    <option value="h6">Heading 6</option>
                </select>
                <select
                    value={getCurrentFontValue()}
                    onChange={handleFontChange}
                    className="h-8 px-2 text-sm bg-transparent border border-gray-200 rounded hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-100 cursor-pointer text-slate-700 font-medium w-24"
                    title="Font Family"
                >
                    <option value="inter">Inter</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Mono</option>
                    <option value="cursive">Cursive</option>
                </select>
            </div>

            {/* Alignment */}
            <div className="flex items-center px-1 border-r border-slate-200 mr-1">
                <select
                    value={getCurrentAlignValue()}
                    onChange={handleAlignChange}
                    className="h-8 px-2 text-sm bg-transparent border border-gray-200 rounded hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-100 cursor-pointer text-slate-700 font-medium w-24"
                    title="Alignment"
                >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                </select>
            </div>

            {/* Basic Formatting */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
                <ToggleButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
                    <Bold size={16} />
                </ToggleButton>
                <ToggleButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
                    <Italic size={16} />
                </ToggleButton>
                <ToggleButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
                    <Underline size={16} />
                </ToggleButton>
                <ToggleButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
                    <Strikethrough size={16} />
                </ToggleButton>
                <div className="relative group flex items-center justify-center -ml-1">
                    <input
                        type="color"
                        onInput={handleColorChange}
                        // SAFE VALUE CHECK: Only allow 6-digit Hex codes (e.g. #FF0000). 
                        // If color is oklch(...) or rgba(...), default to black to prevent input crash.
                        value={/^#[0-9A-F]{6}$/i.test(editor.getAttributes('textStyle').color)
                            ? editor.getAttributes('textStyle').color
                            : '#000000'}
                        className="w-7 h-7 p-0.5 rounded cursor-pointer border-0 bg-transparent"
                        title="Text Color"
                    />
                </div>
            </div>

            {/* Advanced Formatting */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
                <ToggleButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript">
                    <SubIcon size={16} />
                </ToggleButton>
                <ToggleButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript">
                    <SuperIcon size={16} />
                </ToggleButton>
                <ToggleButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Code">
                    <Code size={16} />
                </ToggleButton>
            </div>


            {/* Inserts */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
                <select
                    onChange={(e) => {
                        const [key, label] = e.target.value.split('|');
                        if (key && label) {
                            editor.chain().focus().insertContent({
                                type: 'variable',
                                attrs: { id: key, label: label }
                            }).run();
                            e.target.value = ""; // Reset
                        }
                    }}
                    className="h-8 px-2 text-sm bg-transparent border border-gray-200 rounded hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-100 cursor-pointer text-slate-700 font-medium w-32"
                    title="Insert Variable"
                >
                    <option value="">+ Variable</option>
                    <option value="counterpartyName|Client Name">Client Name</option>
                    <option value="counterpartyEmail|Client Email">Client Email</option>
                    <option value="contractTitle|Contract Title">Contract Title</option>
                    <option value="amount|Contract Value">Contract Value</option>
                    <option value="startDate|Start Date">Start Date</option>
                    <option value="endDate|End Date">End Date</option>
                </select>

                <ToggleButton onClick={addLink} isActive={editor.isActive('link')} title="Link">
                    <LinkIcon size={16} />
                </ToggleButton>
                <ToggleButton onClick={triggerImageUpload} isActive={false} title="Image">
                    <ImageIcon size={16} />
                </ToggleButton>

                {/* Table Builder with Popover */}
                <div className="relative">
                    <button
                        ref={tableButtonRef}
                        onClick={() => setShowTableBuilder(!showTableBuilder)}
                        className={`p-2 rounded-lg transition-all ${showTableBuilder
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        title="Insert Table"
                        type="button"
                    >
                        <TableIcon size={16} />
                    </button>

                    {showTableBuilder && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowTableBuilder(false)}
                            />

                            {/* Popover */}
                            <div className="absolute top-full left-0 mt-2 z-20">
                                <TableBuilder
                                    editor={editor}
                                    onClose={() => setShowTableBuilder(false)}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-1">
                <ToggleButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
                    <List size={16} />
                </ToggleButton>
                <ToggleButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
                    <ListOrdered size={16} />
                </ToggleButton>
                <ToggleButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
                    <Quote size={16} />
                </ToggleButton>
                <ToggleButton onClick={() => editor.chain().focus().setHorizontalRule().run()} isActive={false} title="Page Break / Divider">
                    <Minus size={16} />
                </ToggleButton>
            </div>

            {/* Keyboard Shortcuts Help Button */}
            <button
                onClick={() => setShowShortcutsHelp(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all"
                title="Keyboard Shortcuts (? to open)"
                type="button"
            >
                <Keyboard size={16} />
            </button>

            {/* Keyboard Shortcuts Help Dialog */}
            {showShortcutsHelp && (
                <KeyboardShortcutsHelp onClose={() => setShowShortcutsHelp(false)} />
            )}
        </div>
    );
}
