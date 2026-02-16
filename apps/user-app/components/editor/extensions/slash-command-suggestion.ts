import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { SlashCommandMenu, SlashCommandMenuRef } from '../menus/slash-command-menu';
import { filterCommands } from './slash-command';

export const slashCommandSuggestion = {
    items: ({ query }: { query: string }) => {
        return filterCommands(query);
    },

    render: () => {
        let component: ReactRenderer<SlashCommandMenuRef> | null = null;
        let popup: any = null;

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(SlashCommandMenu, {
                    props: {
                        items: props.items,
                        command: (item: any) => {
                            props.command(item);
                        },
                    },
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props: any) {
                component?.updateProps({
                    items: props.items,
                    command: (item: any) => {
                        props.command(item);
                    },
                });

                if (!props.clientRect) {
                    return;
                }

                popup?.[0]?.setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup?.[0]?.hide();
                    return true;
                }

                return component?.ref?.onKeyDown(props) || false;
            },

            onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
            },
        };
    },
};
