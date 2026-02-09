import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';

// --- The React Component for the Node ---
const VariableComponent = ({ node }: ReactNodeViewProps) => {
    const attrs = node.attrs as { id?: string | null; label?: string | null };
    const label = attrs.label ?? 'Variable';

    return (
        <NodeViewWrapper className="inline-block mx-1 align-middle">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200 text-sm font-medium select-none shadow-sm data-[selected=true]:ring-2 ring-indigo-400">
                <span className="opacity-50 mr-1 text-[10px] uppercase font-bold tracking-wider">VAR</span>
                {label}
            </span>
        </NodeViewWrapper>
    );
};

// --- The TipTap Extension Definition ---
export const VariableExtension = Node.create({
    name: 'variable',

    group: 'inline',

    inline: true,

    selectable: true,

    atom: true, // It acts as a single unit, cursor can't go inside

    addAttributes() {
        return {
            id: {
                default: null,
            },
            label: {
                default: 'Variable',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="variable"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'variable' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(VariableComponent);
    },
});
