'use client';

/**
 * AI Clause Assistant Component
 * 
 * Floating or embedded panel for AI-powered clause suggestions and improvements.
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Button, Badge, Skeleton } from '@repo/ui';
import { useToast } from '@/lib/toast-context';

interface ClauseSuggestion {
    title: string;
    content: string;
    category: string;
    confidence: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onInsertClause: (content: string) => void;
    selectedText?: string;
    embedded?: boolean;
}

export function AiClauseAssistant({ isOpen, onClose, onInsertClause, selectedText, embedded = false }: Props) {
    const toast = useToast();
    const [mode, setMode] = useState<'suggest' | 'improve'>('suggest');
    const [clauseTypes, setClauseTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState('');
    const [suggestions, setSuggestions] = useState<ClauseSuggestion[]>([]);
    const [improvement, setImprovement] = useState<{ improved: string; changes: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [context, setContext] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadClauseTypes();
            if (selectedText && selectedText.length > 20) {
                setMode('improve');
            }
        }
    }, [isOpen, selectedText]);

    const loadClauseTypes = async () => {
        try {
            const data = await api.ai.getClauseTypes();
            setClauseTypes(data.types);
            if (data.types.length > 0 && !selectedType) {
                setSelectedType(data.types[0]);
            }
        } catch (error) {
            console.error('Failed to load clause types', error);
        }
    };

    const handleSuggestClause = async () => {
        if (!selectedType) return;

        try {
            setIsLoading(true);
            setSuggestions([]);
            const result = await api.ai.suggestClause(selectedType, context);
            setSuggestions(result);
        } catch (error) {
            console.error('Failed to get suggestions', error);
            toast.error('AI Error', 'Failed to generate suggestions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImproveClause = async () => {
        if (!selectedText || selectedText.length < 20) {
            toast.warning('Selection Required', 'Select at least 20 characters to improve');
            return;
        }

        try {
            setIsLoading(true);
            setImprovement(null);
            const result = await api.ai.improveClause(selectedText);
            setImprovement({ improved: result.improved, changes: result.changes });
        } catch (error) {
            console.error('Failed to improve clause', error);
            toast.error('AI Error', 'Failed to improve clause');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInsert = (content: string) => {
        onInsertClause(content);
        toast.success('Clause Inserted', 'AI-generated clause added');
        if (!embedded) onClose();
    };

    const formatClauseType = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    if (!isOpen) return null;

    // EMBEDDED LAYOUT
    if (embedded) {
        return (
            <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                {/* Header */}
                <div className="bg-orange-50 border-b border-orange-100 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-lg">🤖</div>
                    <div>
                        <h3 className="font-semibold text-neutral-900">Contract Assistant (v2)</h3>
                        <p className="text-xs text-neutral-500">AI-driven contract analysis.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-200 bg-neutral-50/50">
                    <button
                        onClick={() => setMode('suggest')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${mode === 'suggest'
                            ? 'text-orange-600 border-orange-600 bg-white'
                            : 'text-neutral-500 border-transparent hover:text-neutral-700'
                            }`}
                    >
                        Suggestion
                    </button>
                    <button
                        onClick={() => setMode('improve')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${mode === 'improve'
                            ? 'text-orange-600 border-orange-600 bg-white'
                            : 'text-neutral-500 border-transparent hover:text-neutral-700'
                            }`}
                    >
                        Improvement
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-neutral-50/30">
                    {mode === 'suggest' ? (
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                                <p className="text-sm text-neutral-600 mb-4">
                                    I can help you draft new clauses. What do you need?
                                </p>
                                <div className="space-y-3">
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase">Clause Type</label>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50"
                                    >
                                        {clauseTypes.map(type => (
                                            <option key={type} value={type}>{formatClauseType(type)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Context</label>
                                    <textarea
                                        value={context}
                                        onChange={(e) => setContext(e.target.value)}
                                        placeholder="E.g., stricter liability caps..."
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 resize-none focus:ring-orange-500"
                                        rows={3}
                                    />
                                </div>
                                <Button onClick={handleSuggestClause} className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white" disabled={isLoading}>
                                    {isLoading ? 'Thinking...' : 'Generate Clause'}
                                </Button>
                            </div>

                            {suggestions.length > 0 && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    {suggestions.map((s, i) => (
                                        <div key={i} className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm hover:border-orange-200 transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-medium text-sm text-neutral-900">{s.title}</h4>
                                                <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700">{Math.round(s.confidence * 100)}%</Badge>
                                            </div>
                                            <p className="text-xs text-neutral-600 mb-3 line-clamp-4">{s.content}</p>
                                            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleInsert(s.content)}>Insert</Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                                <p className="text-sm text-neutral-600 mb-4">
                                    Select text in the editor to analyze risks or improve wording.
                                </p>
                                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs text-neutral-600 min-h-[80px] mb-4 overflow-y-auto max-h-[150px]">
                                    {selectedText || <span className="text-neutral-400 italic">No text selected...</span>}
                                </div>
                                <Button
                                    onClick={handleImproveClause}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                    disabled={isLoading || !selectedText || selectedText.length < 20}
                                >
                                    {isLoading ? 'Analyzing...' : 'Analyze & Improve'}
                                </Button>
                            </div>

                            {improvement && (
                                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 mb-2 text-green-600 font-medium text-sm">
                                        <span>✓ Recommendation</span>
                                    </div>
                                    <p className="text-sm text-neutral-700 mb-3 bg-green-50/50 p-2 rounded">{improvement.improved}</p>
                                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleInsert(improvement.improved)}>
                                        Replace Selection
                                    </Button>

                                    {improvement.changes.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-neutral-100">
                                            <p className="text-xs font-semibold text-neutral-500 mb-2">Changes:</p>
                                            <ul className="space-y-1">
                                                {improvement.changes.map((change, idx) => (
                                                    <li key={idx} className="text-xs text-neutral-600 flex items-start gap-2">
                                                        <span className="text-green-500">•</span>
                                                        {change}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Input */}
                <div className="p-3 bg-white border-t border-neutral-200">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Ask about specific risks..."
                            className="w-full pl-4 pr-10 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-orange-500 text-sm"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-orange-500 rounded text-white hover:bg-orange-600">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ORIGINAL POPUP LAYOUT
    return (
        <div className="fixed right-4 top-20 w-96 max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-50 flex flex-col">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <span className="font-semibold">AI Clause Assistant</span>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 rounded-lg p-1 transition-colors">✕</button>
            </div>

            {/* Same content as original popup... reusing logic is tedious in one file without sub-components, 
                so I'm duplicating slightly or could extract content. For now I'm leaving the original popup logic 
                simplistic or similar to before but clean. 
            */}
            <div className="flex border-b border-neutral-200">
                <button onClick={() => setMode('suggest')} className={`flex-1 px-4 py-2 text-sm font-medium ${mode === 'suggest' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}>✨ Suggest</button>
                <button onClick={() => setMode('improve')} className={`flex-1 px-4 py-2 text-sm font-medium ${mode === 'improve' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}>🔧 Improve</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {mode === 'suggest' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Clause Type</label>
                            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                                {clauseTypes.map(type => <option key={type} value={type}>{formatClauseType(type)}</option>)}
                            </select>
                        </div>
                        <Button onClick={handleSuggestClause} className="w-full" disabled={isLoading}>{isLoading ? 'Generating...' : '✨ Generate'}</Button>
                        {suggestions.map((s, i) => (
                            <div key={i} className="p-3 bg-neutral-50 rounded-xl border mb-2">
                                <div className="flex justify-between mb-1"><span className="font-medium text-sm">{s.title}</span><Badge variant="secondary" className="text-xs">{Math.round(s.confidence * 100)}%</Badge></div>
                                <p className="text-xs text-neutral-600 mb-2 line-clamp-3">{s.content}</p>
                                <Button size="sm" className="w-full h-7 text-xs" variant="outline" onClick={() => handleInsert(s.content)}>Insert</Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-3 bg-neutral-100 rounded-lg text-sm text-neutral-600 max-h-32 overflow-y-auto">
                            {selectedText || <span className="text-neutral-400 italic">Select text...</span>}
                        </div>
                        <Button onClick={handleImproveClause} className="w-full" disabled={isLoading || !selectedText}>{isLoading ? 'Analyzing...' : '🔧 Improve'}</Button>
                        {improvement && (
                            <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                                <p className="text-sm text-neutral-700 mb-2">{improvement.improved}</p>
                                <Button size="sm" className="w-full" onClick={() => handleInsert(improvement.improved)}>Use This</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
