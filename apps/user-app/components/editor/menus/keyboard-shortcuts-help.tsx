"use client";

import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { keyboardShortcuts, formatShortcut } from '../utils/keyboard-shortcuts';

interface KeyboardShortcutsHelpProps {
    onClose: () => void;
}

export function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
    const categories = {
        'Formatting': keyboardShortcuts.filter(s =>
            ['b', 'i', 'u', 'k'].includes(s.key)
        ),
        'Document': keyboardShortcuts.filter(s =>
            ['s', 'f', 'z'].includes(s.key)
        ),
        'Headings': keyboardShortcuts.filter(s =>
            s.modifier === 'alt' && ['1', '2', '3'].includes(s.key)
        ),
        'Tables': keyboardShortcuts.filter(s =>
            s.key.includes('Tab')
        ),
        'Lists': keyboardShortcuts.filter(s =>
            ['[', ']'].includes(s.key)
        ),
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500 rounded-lg">
                                <Keyboard size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Keyboard Shortcuts
                                </h2>
                                <p className="text-sm text-slate-600">
                                    Speed up your editing workflow
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            type="button"
                        >
                            <X size={20} className="text-slate-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {Object.entries(categories).map(([category, shortcuts]) => (
                            <div key={category} className="mb-6 last:mb-0">
                                <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 tracking-wide">
                                    {category}
                                </h3>
                                <div className="space-y-2">
                                    {shortcuts.map((shortcut, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="text-slate-700">
                                                {shortcut.description}
                                            </span>
                                            <kbd className="px-3 py-1 bg-slate-100 border border-slate-300 rounded-md text-sm font-mono text-slate-700 shadow-sm">
                                                {formatShortcut(shortcut)}
                                            </kbd>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Pro Tip */}
                        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                            <p className="text-sm text-orange-900 font-semibold mb-1">
                                💡 Pro Tip
                            </p>
                            <p className="text-sm text-orange-800">
                                Type <kbd className="px-2 py-0.5 bg-white border border-orange-300 rounded text-xs font-mono">/</kbd> to open the slash command menu for quick insertion of elements.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
