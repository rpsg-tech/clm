"use client";

import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Link as LinkIcon, Highlighter, MessageSquare } from 'lucide-react';

interface EditorBubbleMenuProps {
    editor: Editor;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const updatePosition = () => {
            // Only show when there's a text selection (not table, not empty)
            const { from, to } = editor.state.selection;
            const isTextSelected = from !== to;
            const isInTable = editor.isActive('table');

            const shouldShow = isTextSelected && !isInTable;
            setIsVisible(shouldShow);

            if (shouldShow) {
                const { view } = editor;
                const start = view.coordsAtPos(from);
                setPosition({
                    top: start.top - 50,
                    left: start.left,
                });
            }
        };

        editor.on('selectionUpdate', updatePosition);
        editor.on('transaction', updatePosition);

        return () => {
            editor.off('selectionUpdate', updatePosition);
            editor.off('transaction', updatePosition);
        };
    }, [editor]);

    if (!isVisible || !editor) return null;

    const setLink = () => {
        const url = window.prompt('Enter URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const MenuButton = ({
        onClick,
        isActive,
        children,
        title,
    }: {
        onClick: () => void;
        isActive?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            onClick={onClick}
            className={`p-2 rounded-lg transition-all ${isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-white hover:bg-slate-800'
                }`}
            title={title}
            type="button"
        >
            {children}
        </button>
    );

    return (
        <div
            className="fixed flex items-center gap-1 bg-slate-900 text-white rounded-xl shadow-xl px-2 py-1.5 backdrop-blur-sm z-50"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <MenuButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold (Cmd+B)"
            >
                <Bold size={16} />
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic (Cmd+I)"
            >
                <Italic size={16} />
            </MenuButton>

            <div className="w-px h-5 bg-slate-700 mx-1" />

            <MenuButton
                onClick={setLink}
                isActive={editor.isActive('link')}
                title="Link (Cmd+K)"
            >
                <LinkIcon size={16} />
            </MenuButton>

            <MenuButton
                onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run();
                }}
                isActive={editor.isActive('highlight')}
                title="Highlight"
            >
                <Highlighter size={16} />
            </MenuButton>

            {/* Placeholder for comments - Phase 4 */}
            <div className="w-px h-5 bg-slate-700 mx-1" />

            <MenuButton
                onClick={() => {
                    console.log('Add comment - Phase 4');
                }}
                isActive={false}
                title="Add Comment (Phase 4)"
            >
                <MessageSquare size={16} />
            </MenuButton>
        </div>
    );
}
