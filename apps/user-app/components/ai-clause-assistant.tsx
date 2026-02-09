'use client';

/**
 * AI Clause Assistant Component
 * 
 * Floating or embedded panel for AI-powered clause suggestions and improvements.
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Button, Badge } from '@repo/ui';
import { useToast } from '@/lib/toast-context';
import { Sparkles, ArrowRight, X, Bot, Wand2, FileText, Check } from 'lucide-react';

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
    if (!isOpen) return null;

    if (embedded) {
        return (
            <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-orange-50/50 border-b border-orange-100 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">Contract Assistant</h3>
                        <p className="text-[10px] text-slate-500 font-medium">AI-driven analysis v2.0</p>
                    </div>
                </div>
                <AiAssistantContent
                    onInsertClause={onInsertClause}
                    selectedText={selectedText}
                    onClose={onClose} // Optional for embedded
                />
            </div>
        );
    }

    // Popup Layout
    return (
        <div className="fixed right-4 top-24 w-96 max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col animate-in slide-in-from-right-5 fade-in duration-300">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-orange-400" />
                    <span className="font-bold text-sm">AI Clause Assistant</span>
                </div>
                <button onClick={onClose} className="hover:bg-white/10 rounded-full p-1 transition-colors">
                    <X size={16} />
                </button>
            </div>
            <AiAssistantContent
                onInsertClause={onInsertClause}
                selectedText={selectedText}
                onClose={onClose}
            />
        </div>
    );
}

// Sub-component containing the core logic and UI
function AiAssistantContent({ onInsertClause, selectedText, onClose }: { onInsertClause: (c: string) => void; selectedText?: string; onClose?: () => void }) {
    const toast = useToast();
    const [mode, setMode] = useState<'suggest' | 'improve'>('suggest');
    const [clauseTypes, setClauseTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState('');
    const [suggestions, setSuggestions] = useState<ClauseSuggestion[]>([]);
    const [improvement, setImprovement] = useState<{ improved: string; changes: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [context, setContext] = useState('');

    useEffect(() => {
        loadClauseTypes();
        if (selectedText && selectedText.length > 20) {
            setMode('improve');
        }
    }, [selectedText]);

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
        if (onClose) onClose();
    };

    const formatClauseType = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <>
            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                <button
                    onClick={() => setMode('suggest')}
                    className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 ${mode === 'suggest'
                        ? 'text-orange-600 border-orange-600 bg-white'
                        : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Wand2 size={14} /> Generator
                    </div>
                </button>
                <button
                    onClick={() => setMode('improve')}
                    className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 ${mode === 'improve'
                        ? 'text-orange-600 border-orange-600 bg-white'
                        : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <FileText size={14} /> Review
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
                {mode === 'suggest' ? (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-orange-100">
                            <p className="text-sm text-slate-600 mb-4 font-medium">
                                I can generate standardized legal clauses for you.
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Clause Type</label>
                                    <div className="relative">
                                        <select
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none appearance-none"
                                        >
                                            {clauseTypes.map(type => (
                                                <option key={type} value={type}>{formatClauseType(type)}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m1 1 4 4 4-4" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Specific Requirements</label>
                                    <textarea
                                        value={context}
                                        onChange={(e) => setContext(e.target.value)}
                                        placeholder="E.g., stricter liability caps, 30 days notice..."
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none placeholder:text-slate-400"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleSuggestClause}
                                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2"><Sparkles size={14} className="animate-spin" /> Thinking...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><Sparkles size={14} /> Generate Clause</span>
                                )}
                            </Button>
                        </div>

                        {suggestions.length > 0 && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 pb-4">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="h-px bg-slate-200 flex-1"></span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Suggestions</span>
                                    <span className="h-px bg-slate-200 flex-1"></span>
                                </div>
                                {suggestions.map((s, i) => (
                                    <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-sm text-slate-900">{s.title}</h4>
                                            <Badge variant="secondary" className="text-[10px] font-bold bg-green-50 text-green-700 border-green-100">
                                                {s.confidence ? Math.round(s.confidence * 100) : 0}% MATCH
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-600 mb-3 leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                                            {s.content}
                                        </p>
                                        <Button size="sm" variant="outline" className="w-full text-xs h-8 border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50" onClick={() => handleInsert(s.content)}>
                                            Insert Clause
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-600 mb-4 font-medium">
                                Select text in the editor to analyze risks or improve clarity.
                            </p>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 min-h-[80px] mb-4 overflow-y-auto max-h-[150px] font-mono leading-relaxed">
                                {selectedText || <span className="text-slate-400 italic flex items-center justify-center h-full gap-2"><FileText size={14} /> No text selected...</span>}
                            </div>
                            <Button
                                onClick={handleImproveClause}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10"
                                disabled={isLoading || !selectedText || selectedText.length < 20}
                            >
                                {isLoading ? 'Analyzing...' : 'Analyze Selection'}
                            </Button>
                        </div>

                        {improvement && (
                            <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                <div className="flex items-center gap-2 mb-3 text-green-700 font-bold text-sm">
                                    <Check size={16} />
                                    <span>Improved Version</span>
                                </div>
                                <div className="text-sm text-slate-700 mb-4 bg-green-50/50 p-3 rounded-lg border border-green-100/50 leading-relaxed">
                                    {improvement.improved}
                                </div>
                                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white h-9" onClick={() => handleInsert(improvement.improved)}>
                                    Replace Original
                                </Button>

                                {improvement.changes && improvement.changes.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Key Improvements</p>
                                        <ul className="space-y-1.5">
                                            {improvement.changes.map((change, idx) => (
                                                <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                                    <span className="text-green-500 mt-0.5">•</span>
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
            <div className="p-3 bg-white border-t border-slate-200 relative z-10">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ask about specific risks..."
                        className="w-full pl-4 pr-10 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm bg-slate-50 transition-all placeholder:text-slate-400"
                    />
                    <button className="absolute right-1.5 top-1.5 p-1.5 bg-slate-200 rounded-full text-slate-500 hover:bg-orange-600 hover:text-white transition-all">
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </>
    );
}
