"use client";

import { useState, useEffect, useRef } from "react";
import {
    Bold, Italic, Link as LinkIcon, Image as ImageIcon,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
    Undo, Redo, Quote, Table as TableIcon, Video,
    Indent, Outdent
} from "lucide-react";

interface RichTextEditorProps {
    value?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ value = "", onChange, placeholder, className = "" }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isLocked = useRef(false);

    // Sync content updates ensuring we don't overwrite user typing
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const currentHTML = editor.innerHTML;
        // Normalize HTML for comparison if needed, but strict check usually simpler
        // Only update if the content is different and we are NOT the ones who just initiated the change (isLocked)
        if (value !== currentHTML && !isLocked.current) {
            // Check if focused to avoid jarring updates if it happens to be valid external update (like reset)
            editor.innerHTML = value; // This might interpret newlines differently, parent should handle <br> conversion if needed
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (editorRef.current && onChange) {
            isLocked.current = true; // Lock incoming updates
            const newContent = editorRef.current.innerHTML;
            onChange(newContent);

            // Unlock after a microtask/timeout allowing React cycle to complete
            setTimeout(() => {
                isLocked.current = false;
            }, 0);
        }
    };

    const handleCommand = (command: string, arg?: string) => {
        let value = arg;

        if (command === "createLink" && !value) {
            value = prompt("Enter URL:") || undefined;
            if (!value) return;
        }

        if (command === "insertImage" && !value) {
            value = prompt("Enter Image URL:") || undefined;
            if (!value) return;
        }

        if (command === "insertHTML" && !value) {
            // For video or custom HTML placeholders
            return;
        }

        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
            // Trigger input event manually as execCommand doesn't always fire it for React's onInput
            const event = new Event('input', { bubbles: true });
            editorRef.current.dispatchEvent(event);
        }
    };

    const ToolbarButton = ({ icon: Icon, command, value, active = false }: any) => (
        <button
            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
            onClick={() => handleCommand(command, value)}
            className={`p-1.5 rounded-md transition-all text-gray-500 hover:text-gray-900 hover:bg-gray-100 ${active ? "bg-gray-200 text-gray-900" : ""
                }`}
            type="button"
        >
            <Icon size={18} strokeWidth={2} />
        </button>
    );

    const ToolbarDivider = () => <div className="w-px h-5 bg-gray-200 mx-1" />;

    return (
        <div className={`flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50/50 flex-wrap">
                <div className="flex items-center gap-0.5">
                    <ToolbarButton icon={Undo} command="undo" />
                    <ToolbarButton icon={Redo} command="redo" />
                </div>

                <ToolbarDivider />

                <div className="flex items-center gap-2 px-2">
                    <select
                        onMouseDown={(e) => {
                            // We can't simply preventDefault on select as it stops it from opening
                            // Instead we rely on re-focusing after change
                        }}
                        className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none cursor-pointer"
                        onChange={(e) => handleCommand("formatBlock", e.target.value)}
                        defaultValue="p"
                    >
                        <option value="p">Paragraph</option>
                        <option value="H1">Heading 1</option>
                        <option value="H2">Heading 2</option>
                        <option value="H3">Heading 3</option>
                    </select>
                </div>

                <ToolbarDivider />

                <div className="flex items-center gap-0.5">
                    <ToolbarButton icon={Bold} command="bold" />
                    <ToolbarButton icon={Italic} command="italic" />
                    {/* Underline not in screenshot but helpful */}
                    {/* <ToolbarButton icon={Underline} command="underline" /> */}
                </div>

                <ToolbarDivider />

                <div className="flex items-center gap-0.5">
                    <ToolbarButton icon={LinkIcon} command="createLink" />
                    <ToolbarButton icon={ImageIcon} command="insertImage" />
                    <ToolbarButton icon={TableIcon} command="insertHTML" value="<table border='1' class='w-full border-collapse border border-gray-300 my-4'><tr><td class='border border-gray-300 p-2'>Cell 1</td><td class='border border-gray-300 p-2'>Cell 2</td></tr></table>" />
                </div>

                <ToolbarDivider />

                <div className="flex items-center gap-0.5">
                    <ToolbarButton icon={Quote} command="formatBlock" value="blockquote" />
                </div>

                <ToolbarDivider />

                <div className="flex items-center gap-0.5">
                    <ToolbarButton icon={List} command="insertUnorderedList" />
                    <ToolbarButton icon={ListOrdered} command="insertOrderedList" />
                    <ToolbarButton icon={Indent} command="indent" />
                    <ToolbarButton icon={Outdent} command="outdent" />
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 bg-white relative">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    suppressContentEditableWarning={true}
                    className="w-full h-full p-8 focus:outline-none prose max-w-none font-serif text-lg leading-relaxed text-gray-800 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 cursor-text min-h-[400px]"
                    data-placeholder={placeholder}
                    style={{ minHeight: "100%" }}
                />
            </div>
        </div>
    );
}
