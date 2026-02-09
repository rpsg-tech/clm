'use client';

import { useState, useRef, useEffect } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { mockAiChat, type AiChatMessage } from '@/lib/ai-mock';
import { cn } from '@repo/ui';

interface AiAssistantPanelProps {
    contractId: string;
    onInsertText?: (text: string) => void;
}

const SUGGESTED_PROMPTS = [
    { label: 'Summarize Key Risks', icon: 'warning', query: 'Identify and summarize key risk areas in this contract.' },
    { label: 'Explain Payment Terms', icon: 'payments', query: 'What are the specific payment terms and milestones?' },
    { label: 'Suggest Improvements', icon: 'auto_fix_high', query: 'Suggest clause improvements based on best practices.' },
    { label: 'Draft Termination Clause', icon: 'edit_document', query: 'Draft a standard termination for convenience clause.' },
];

export function AiAssistantPanel({ contractId: _contractId, onInsertText: _onInsertText }: AiAssistantPanelProps) {
    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function handleSend(query?: string) {
        const q = (query || input).trim();
        if (!q || isThinking) return;

        const userMessage: AiChatMessage = { role: 'user', content: q };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsThinking(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));
            const response = await mockAiChat(q);
            const assistantMessage: AiChatMessage = { role: 'assistant', content: response };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch {
            const errorMessage: AiChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error connecting to Oracle AI. Please try again.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsThinking(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="flex flex-col h-full bg-violet-50 relative overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-violet-200 bg-violet-50 flex items-center gap-3 flex-shrink-0 z-10">
                <div className="size-8 rounded-full bg-white border border-violet-100 flex items-center justify-center text-violet-700">
                    <MaterialIcon name="psychology" size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-violet-900 flex items-center gap-1.5">
                        Oracle AI
                    </h3>
                    <p className="text-xs text-violet-600 font-medium">Your intelligent contract copilot</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10">
                {messages.length === 0 && (
                    <div className="space-y-4 pt-4">
                        <div className="text-center px-4">
                            <h4 className="text-sm font-semibold text-violet-900 mb-1">How can I help you today?</h4>
                            <p className="text-xs text-violet-600">I can analyze clauses, suggest edits, and answer questions about this document.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest px-2">Suggestions</p>
                            {SUGGESTED_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt.label}
                                    onClick={() => handleSend(prompt.query)}
                                    disabled={isThinking}
                                    className="w-full flex items-start gap-3 p-3 rounded-lg border border-violet-100 bg-white shadow-sm hover:shadow-md hover:border-violet-200 transition-all text-left group"
                                >
                                    <div className="size-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                                        <MaterialIcon
                                            name={prompt.icon}
                                            size={16}
                                            className="text-violet-600"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-sm font-semibold text-violet-900 block group-hover:text-violet-700 transition-colors">{prompt.label}</span>
                                        <span className="text-xs text-violet-600 truncate block">{prompt.query}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={cn("animate-in slide-in-from-bottom-2 fade-in duration-300", msg.role === 'user' ? 'flex justify-end' : 'flex justify-start')}>
                        {msg.role === 'user' ? (
                            <div className="flex items-start gap-2 max-w-[85%]">
                                <div className="bg-indigo-600 text-white px-4 py-3 rounded-lg rounded-tr-none text-sm shadow-md">
                                    {msg.content}
                                </div>
                                <div className="size-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                                    <MaterialIcon name="person" size={14} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 max-w-[85%]">
                                <div className="size-6 rounded-full bg-white border border-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0">
                                    <MaterialIcon name="smart_toy" size={14} />
                                </div>
                                <div className="bg-white border border-violet-100 px-4 py-3 rounded-lg rounded-tl-none text-sm text-neutral-700 shadow-sm whitespace-pre-wrap leading-relaxed">
                                    {msg.content}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isThinking && (
                    <div className="flex items-start gap-2">
                        <div className="size-6 rounded-full bg-white border border-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0">
                            <MaterialIcon name="smart_toy" size={14} />
                        </div>
                        <div className="flex items-center gap-3 bg-white border border-violet-100 px-4 py-3 rounded-lg animate-pulse">
                            <div className="flex gap-1">
                                <div className="size-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="size-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="size-2 bg-violet-500 rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-xs font-medium text-violet-700">Analyzing...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-violet-200 bg-violet-50 z-20">
                <div className="flex items-end gap-2 bg-white border border-violet-200 rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-violet-300 focus-within:border-violet-300 transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about the contract..."
                        aria-label="Ask Oracle AI about the contract"
                        rows={1}
                        className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none min-h-[44px]"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isThinking}
                        aria-label="Send message"
                        className="p-2 rounded-lg bg-violet-700 hover:bg-violet-800 disabled:bg-neutral-200 text-white disabled:text-neutral-400 transition-colors flex-shrink-0 shadow-sm disabled:shadow-none"
                    >
                        <MaterialIcon name="arrow_upward" size={18} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-violet-500">AI can make mistakes. Verify critical information.</p>
                </div>
            </div>
        </div>
    );
}
