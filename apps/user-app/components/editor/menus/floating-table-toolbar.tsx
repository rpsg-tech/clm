"use client";

import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
    Plus, Minus, Merge, Split, AlignLeft, AlignCenter,
    AlignRight, Trash2, ArrowUp, ArrowDown, ChevronLeft, ChevronRight
} from 'lucide-react';

interface FloatingTableToolbarProps {
    editor: Editor;
}

export function FloatingTableToolbar({ editor }: FloatingTableToolbarProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const updatePosition = () => {
            const isTableActive = editor.isActive('table');
            setIsVisible(isTableActive);

            if (isTableActive) {
                const { view } = editor;
                const { from } = view.state.selection;
                const start = view.coordsAtPos(from);

                // Toolbar dimensions (approximate or could use ref)
                const toolbarWidth = 480; // Approximate width based on content
                const windowWidth = window.innerWidth;
                const padding = 20;

                // Calculate left position with boundary check
                let left = start.left;

                // If toolbar would go off the right edge, align it to the right edge with padding
                if (left + toolbarWidth > windowWidth) {
                    left = windowWidth - toolbarWidth - padding;
                }

                // Ensure it doesn't go off the left edge either
                if (left < padding) {
                    left = padding;
                }

                setPosition({
                    top: start.bottom + 15, // Position below selection to avoid blocking text
                    left: left,
                });
            }
        };

        editor.on('selectionUpdate', updatePosition);
        editor.on('transaction', updatePosition);
        // Add window resize listener
        window.addEventListener('resize', updatePosition);

        return () => {
            editor.off('selectionUpdate', updatePosition);
            editor.off('transaction', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [editor]);

    if (!isVisible || !editor) return null;

    const ToolbarButton = ({
        onClick,
        children,
        title,
        danger = false,
        className = "",
    }: {
        onClick: () => void;
        children: React.ReactNode;
        title: string;
        danger?: boolean;
        className?: string;
    }) => (
        <button
            onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus loss
                e.stopPropagation(); // Stop event bubbling
                onClick();
            }}
            title={title}
            className={`p-2 rounded-lg transition-all hover:scale-105 active:scale-95 ${danger
                ? 'text-rose-600 hover:bg-rose-50 active:bg-rose-100'
                : 'text-slate-700 hover:bg-white active:bg-slate-50'
                } ${className}`}
            type="button"
        >
            {children}
        </button>
    );

    const Divider = () => <div className="w-px h-6 bg-slate-300 mx-1" />;
    const Label = ({ children }: { children: React.ReactNode }) => (
        <span className="text-[11px] uppercase font-bold text-slate-500 px-1">
            {children}
        </span>
    );

    return (
        <div
            className="fixed flex items-center gap-1 bg-slate-50 border-2 border-slate-300 rounded-xl shadow-2xl px-3 py-2 backdrop-blur-sm z-50"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            {/* Row Controls */}
            <div className="flex items-center gap-1">
                <Label>ROW:</Label>
                <ToolbarButton
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    title="Insert Row Above"
                >
                    <ArrowUp size={16} strokeWidth={2.5} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    title="Insert Row Below"
                >
                    <ArrowDown size={16} strokeWidth={2.5} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    title="Delete Row"
                    danger
                >
                    <Minus size={16} strokeWidth={2.5} />
                </ToolbarButton>
            </div>

            <Divider />

            {/* Column Controls */}
            <div className="flex items-center gap-1">
                <Label>COL:</Label>
                <ToolbarButton
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    title="Insert Column Left"
                >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    title="Insert Column Right"
                >
                    <ChevronRight size={16} strokeWidth={2.5} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    title="Delete Column"
                    danger
                >
                    <Minus size={16} strokeWidth={2.5} />
                </ToolbarButton>
            </div>

            <Divider />

            {/* Cell Controls */}
            <div className="flex items-center gap-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().mergeCells().run()}
                    title="Merge Cells"
                >
                    <Merge size={15} strokeWidth={2} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().splitCell().run()}
                    title="Split Cell"
                >
                    <Split size={15} strokeWidth={2} />
                </ToolbarButton>
            </div>

            <Divider />

            {/* Alignment */}
            <div className="flex items-center gap-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().setCellAttribute('textAlign', 'left').run()}
                    title="Align Left"
                >
                    <AlignLeft size={15} strokeWidth={2} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setCellAttribute('textAlign', 'center').run()}
                    title="Align Center"
                >
                    <AlignCenter size={15} strokeWidth={2} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setCellAttribute('textAlign', 'right').run()}
                    title="Align Right"
                >
                    <AlignRight size={15} strokeWidth={2} />
                </ToolbarButton>
            </div>

            <Divider />

            {/* Cell Background Color */}
            <div className="relative">
                <input
                    type="color"
                    onMouseDown={(e) => e.stopPropagation()} // Prevent focus loss
                    onChange={(e) => {
                        e.preventDefault();
                        editor.chain().focus().setCellAttribute('backgroundColor', e.target.value).run();
                    }}
                    className="w-8 h-8 p-0.5 rounded-lg cursor-pointer border-2 border-slate-300 hover:border-orange-400 transition-colors"
                    title="Cell Background Color"
                />
            </div>

            <Divider />

            {/* Delete Table */}
            <ToolbarButton
                onClick={() => {
                    if (window.confirm('Delete this table?')) {
                        editor.chain().focus().deleteTable().run();
                    }
                }}
                title="Delete Table"
                danger
            >
                <Trash2 size={15} strokeWidth={2} />
            </ToolbarButton>
        </div>
    );
}
