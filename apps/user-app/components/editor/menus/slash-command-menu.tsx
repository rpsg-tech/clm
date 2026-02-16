"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CommandItem } from '../extensions/slash-command';

interface SlashCommandMenuProps {
    items: CommandItem[];
    command: (item: CommandItem) => void;
}

export interface SlashCommandMenuRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
    ({ items, command }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0);

        useEffect(() => {
            setSelectedIndex(0);
        }, [items]);

        const selectItem = (index: number) => {
            const item = items[index];
            if (item) {
                command(item);
            }
        };

        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }) => {
                if (event.key === 'ArrowUp') {
                    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
                    return true;
                }

                if (event.key === 'ArrowDown') {
                    setSelectedIndex((selectedIndex + 1) % items.length);
                    return true;
                }

                if (event.key === 'Enter') {
                    selectItem(selectedIndex);
                    return true;
                }

                return false;
            },
        }));

        if (items.length === 0) {
            return (
                <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 min-w-[280px]">
                    <p className="text-slate-400 text-sm">No commands found</p>
                </div>
            );
        }

        return (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[320px] max-h-[400px] overflow-y-auto">
                <div className="p-2">
                    <p className="text-xs uppercase font-bold text-slate-400 px-2 pb-2">
                        Quick Insert
                    </p>
                    {items.map((item, index) => (
                        <button
                            key={item.title}
                            onClick={() => selectItem(index)}
                            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all text-left ${index === selectedIndex
                                    ? 'bg-orange-50 border border-orange-200'
                                    : 'hover:bg-slate-50 border border-transparent'
                                }`}
                            type="button"
                        >
                            {/* Icon */}
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${index === selectedIndex
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                            >
                                {item.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div
                                    className={`font-semibold text-sm ${index === selectedIndex ? 'text-orange-900' : 'text-slate-700'
                                        }`}
                                >
                                    {item.title}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                    {item.description}
                                </div>
                            </div>

                            {/* Selected indicator */}
                            {index === selectedIndex && (
                                <div className="text-orange-500 text-xs font-bold">↵</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
);

SlashCommandMenu.displayName = 'SlashCommandMenu';
