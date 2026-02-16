"use client";

import { useState } from 'react';
import { Search, X, ChevronUp, ChevronDown, Replace } from 'lucide-react';

interface FindReplaceDialogProps {
    onClose: () => void;
    onFind: (query: string, options: SearchOptions) => void;
    onReplace: (replacement: string, replaceAll: boolean) => void;
    matchCount?: number;
    currentMatch?: number;
}

export interface SearchOptions {
    caseSensitive: boolean;
    wholeWord: boolean;
}

export function FindReplaceDialog({
    onClose,
    onFind,
    onReplace,
    matchCount = 0,
    currentMatch = 0,
}: FindReplaceDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [showReplace, setShowReplace] = useState(false);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        onFind(query, { caseSensitive, wholeWord });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter' && searchQuery) {
            if (e.shiftKey) {
                // Previous match
            } else {
                // Next match
            }
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="fixed top-20 right-6 z-50 w-full max-w-md">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <Search size={18} className="text-slate-600" />
                            <h3 className="font-semibold text-slate-900">
                                Find & Replace
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                            type="button"
                        >
                            <X size={18} className="text-slate-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                        {/* Search Input */}
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Find..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-3 py-2 pr-24 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <span className="text-xs text-slate-500 mr-1">
                                            {matchCount > 0 ? `${currentMatch} of ${matchCount}` : 'No matches'}
                                        </span>
                                        <button
                                            className="p-1 hover:bg-slate-100 rounded"
                                            title="Previous (Shift+Enter)"
                                            type="button"
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                        <button
                                            className="p-1 hover:bg-slate-100 rounded"
                                            title="Next (Enter)"
                                            type="button"
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Options */}
                            <div className="flex items-center gap-3 text-sm">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={caseSensitive}
                                        onChange={(e) => {
                                            setCaseSensitive(e.target.checked);
                                            handleSearch(searchQuery);
                                        }}
                                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-slate-700">Case sensitive (Aa)</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={wholeWord}
                                        onChange={(e) => {
                                            setWholeWord(e.target.checked);
                                            handleSearch(searchQuery);
                                        }}
                                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-slate-700">Whole word</span>
                                </label>
                            </div>
                        </div>

                        {/* Replace Section */}
                        {showReplace ? (
                            <div className="space-y-2 pt-2 border-t border-slate-200">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Replace with..."
                                        value={replaceText}
                                        onChange={(e) => setReplaceText(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onReplace(replaceText, false)}
                                        disabled={!searchQuery || matchCount === 0}
                                        className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm transition-colors"
                                        type="button"
                                    >
                                        Replace
                                    </button>
                                    <button
                                        onClick={() => onReplace(replaceText, true)}
                                        disabled={!searchQuery || matchCount === 0}
                                        className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                                        type="button"
                                    >
                                        Replace All
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowReplace(true)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-sm"
                                type="button"
                            >
                                <Replace size={14} />
                                <span>Show Replace</span>
                            </button>
                        )}
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                        <div className="flex items-center justify-between">
                            <span>Enter: Next</span>
                            <span>Shift+Enter: Previous</span>
                            <span>Esc: Close</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
