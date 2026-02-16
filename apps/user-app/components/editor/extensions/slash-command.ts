"use client";

import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export interface CommandItem {
    title: string;
    description: string;
    icon: string;
    command: (props: { editor: any; range: any }) => void;
    aliases?: string[];
}

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                startOfLine: false,
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

// Define available slash commands
export const slashCommands: CommandItem[] = [
    {
        title: 'Heading 1',
        description: 'Large section heading',
        icon: 'H1',
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode('heading', { level: 1 })
                .run();
        },
        aliases: ['h1', 'title'],
    },
    {
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: 'H2',
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode('heading', { level: 2 })
                .run();
        },
        aliases: ['h2', 'subtitle'],
    },
    {
        title: 'Heading 3',
        description: 'Small section heading',
        icon: 'H3',
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode('heading', { level: 3 })
                .run();
        },
        aliases: ['h3'],
    },
    {
        title: 'Paragraph',
        description: 'Normal text block',
        icon: 'P',
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode('paragraph')
                .run();
        },
        aliases: ['p', 'text'],
    },
    {
        title: 'Bullet List',
        description: 'Unordered list',
        icon: '•',
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleBulletList()
                .run();
        },
        aliases: ['ul', 'bullet', 'list'],
    },
    {
        title: 'Numbered List',
        description: 'Ordered list with numbers',
        icon: '1.',
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleOrderedList()
                .run();
        },
        aliases: ['ol', 'numbered', 'ordered'],
    },
    {
        title: 'Table',
        description: 'Insert a 3x3 table',
        icon: '⊞',
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run();
        },
        aliases: ['grid'],
    },
    {
        title: 'Quote',
        description: 'Blockquote text',
        icon: '"',
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleBlockquote()
                .run();
        },
        aliases: ['blockquote', 'citation'],
    },
    {
        title: 'Divider',
        description: 'Horizontal rule',
        icon: '—',
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setHorizontalRule()
                .run();
        },
        aliases: ['hr', 'line', 'separator'],
    },
];

// Fuzzy search function
export function filterCommands(query: string): CommandItem[] {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
        return slashCommands;
    }

    return slashCommands.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(normalizedQuery);
        const descMatch = item.description.toLowerCase().includes(normalizedQuery);
        const aliasMatch = item.aliases?.some((alias) =>
            alias.toLowerCase().includes(normalizedQuery)
        );

        return titleMatch || descMatch || aliasMatch;
    });
}
