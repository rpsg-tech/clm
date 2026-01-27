import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

// --- The React Component for the Node ---
const VariableComponent = (props: any) => {
    return (
        <NodeViewWrapper className="inline-block mx-1 align-middle">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200 text-sm font-medium select-none shadow-sm data-[selected=true]:ring-2 ring-orange-400">
                <span className="opacity-50 mr-1 text-[10px] uppercase font-bold tracking-wider">VAR</span>
                {props.node.attrs.label}
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
