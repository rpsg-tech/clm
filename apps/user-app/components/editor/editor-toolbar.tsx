"use client";

import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
    Bold, Italic, Strikethrough, Underline, Code,
    List, ListOrdered, Quote, Minus, Undo, Redo,
    Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
    Subscript as SubIcon, Superscript as SuperIcon,
    Merge, Split, Scissors
} from 'lucide-react';

interface EditorToolbarProps {
    editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="flex flex-wrap items-center gap-1 p-2 bg-white border-b border-slate-100 sticky top-0 z-10 w-full">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />

            {/* History */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-100 mr-1">
                <ToggleButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
                    <Undo size={16} />
                </ToggleButton>
                <ToggleButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
                    <Redo size={16} />
                </ToggleButton>
            </div>

            {/* Typography */}
            <div className="flex items-center px-1 border-r border-slate-100 gap-1 mr-1">
                <select
                    value={getCurrentHeadingValue()}
                    onChange={handleHeadingChange}
                    className="h-8 px-2 text-sm bg-transparent border border-gray-200 rounded hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-100 cursor-pointer text-slate-700 font-medium w-28"
                    title="Heading Level"
                >
                    <option value="p">Normal</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
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
            <div className="flex items-center px-1 border-r border-slate-100 mr-1">
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
            <div className="flex items-center gap-1 pr-2 border-r border-slate-100 mr-1">
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
            <div className="flex items-center gap-1 pr-2 border-r border-slate-100 mr-1">
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
            <div className="flex items-center gap-1 pr-2 border-r border-slate-100 mr-1">
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
                <ToggleButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} isActive={false} title="Table">
                    <TableIcon size={16} />
                </ToggleButton>
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

            {/* Table Controls (Contextual) */}
            {editor.isActive('table') && (
                <div className="flex items-center gap-1 pl-2 border-l border-slate-100 ml-1 bg-slate-50 rounded-r-lg overflow-x-auto">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Table:</span>

                    {/* Cells */}
                    <div className="flex gap-0.5">
                        <ToggleButton onClick={() => editor.chain().focus().mergeCells().run()} title="Merge Cells">
                            <Merge size={14} />
                        </ToggleButton>
                        <ToggleButton onClick={() => editor.chain().focus().splitCell().run()} title="Split Cell">
                            <Split size={14} />
                        </ToggleButton>
                    </div>

                    <div className="w-px h-4 bg-slate-300 mx-1"></div>

                    {/* Columns */}
                    <div className="flex gap-0.5 items-center">
                        <ToggleButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before">
                            <span className="text-[10px] font-bold">+Col&lt;</span>
                        </ToggleButton>
                        <ToggleButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After">
                            <span className="text-[10px] font-bold">+Col&gt;</span>
                        </ToggleButton>
                        <ToggleButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                            <span className="text-[10px] font-bold px-1">×Col</span>
                        </ToggleButton>
                    </div>

                    <div className="w-px h-4 bg-slate-300 mx-1"></div>

                    {/* Rows */}
                    <div className="flex gap-0.5 items-center">
                        <ToggleButton onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before">
                            <span className="text-[10px] font-bold">+Row^</span>
                        </ToggleButton>
                        <ToggleButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After">
                            <span className="text-[10px] font-bold">+Rowv</span>
                        </ToggleButton>
                        <ToggleButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                            <span className="text-[10px] font-bold px-1">×Row</span>
                        </ToggleButton>
                    </div>

                    <div className="w-px h-4 bg-slate-300 mx-1"></div>

                    <ToggleButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Entire Table">
                        <Scissors size={14} className="text-red-600" />
                    </ToggleButton>
                </div>
            )}
        </div>
    );
}
