import { Editor } from '@tiptap/react';

export interface KeyboardShortcut {
    key: string;
    description: string;
    action: (editor: Editor) => void;
    modifier?: 'cmd' | 'ctrl' | 'shift' | 'alt';
}

export const keyboardShortcuts: KeyboardShortcut[] = [
    // Formatting
    {
        key: 'b',
        modifier: 'cmd',
        description: 'Bold',
        action: (editor) => editor.chain().focus().toggleBold().run(),
    },
    {
        key: 'i',
        modifier: 'cmd',
        description: 'Italic',
        action: (editor) => editor.chain().focus().toggleItalic().run(),
    },
    {
        key: 'u',
        modifier: 'cmd',
        description: 'Underline',
        action: (editor) => editor.chain().focus().toggleUnderline().run(),
    },
    {
        key: 'k',
        modifier: 'cmd',
        description: 'Insert Link',
        action: (editor) => {
            const url = window.prompt('Enter URL:');
            if (url) {
                editor.chain().focus().setLink({ href: url }).run();
            }
        },
    },

    // Document actions
    {
        key: 's',
        modifier: 'cmd',
        description: 'Save (Manual)',
        action: () => {
            // This will be handled by the parent component
            console.log('Manual save triggered');
        },
    },
    {
        key: 'f',
        modifier: 'cmd',
        description: 'Find & Replace',
        action: () => {
            // This will be handled by the parent component
            console.log('Find & Replace triggered');
        },
    },

    // Navigation
    {
        key: 'z',
        modifier: 'cmd',
        description: 'Undo',
        action: (editor) => editor.chain().focus().undo().run(),
    },
    {
        key: 'z',
        modifier: 'shift',
        description: 'Redo (Cmd+Shift+Z)',
        action: (editor) => editor.chain().focus().redo().run(),
    },

    // Tables
    {
        key: 'Tab',
        description: 'Next cell in table',
        action: (editor) => {
            if (editor.isActive('table')) {
                editor.chain().focus().goToNextCell().run();
            }
        },
    },
    {
        key: 'Shift+Tab',
        description: 'Previous cell in table',
        action: (editor) => {
            if (editor.isActive('table')) {
                editor.chain().focus().goToPreviousCell().run();
            }
        },
    },

    // Headings
    {
        key: '1',
        modifier: 'alt',
        description: 'Heading 1',
        action: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
    },
    {
        key: '2',
        modifier: 'alt',
        description: 'Heading 2',
        action: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
    },
    {
        key: '3',
        modifier: 'alt',
        description: 'Heading 3',
        action: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
    },

    // Lists and indentation
    {
        key: '[',
        modifier: 'cmd',
        description: 'Outdent',
        action: (editor) => editor.chain().focus().liftListItem('listItem').run(),
    },
    {
        key: ']',
        modifier: 'cmd',
        description: 'Indent',
        action: (editor) => editor.chain().focus().sinkListItem('listItem').run(),
    },
];

// Helper to get platform-specific modifier key
export function getModifierKey(): 'cmd' | 'ctrl' {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'cmd' : 'ctrl';
}

// Format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
    const mod = shortcut.modifier || '';
    const isMac = getModifierKey() === 'cmd';

    let formatted = '';

    if (mod === 'cmd') {
        formatted += isMac ? '⌘' : 'Ctrl';
    } else if (mod === 'ctrl') {
        formatted += 'Ctrl';
    } else if (mod === 'shift') {
        formatted += isMac ? '⇧' : 'Shift';
    } else if (mod === 'alt') {
        formatted += isMac ? '⌥' : 'Alt';
    }

    if (formatted) formatted += ' + ';
    formatted += shortcut.key.toUpperCase();

    return formatted;
}
