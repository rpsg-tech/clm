'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Sparkles, X, Send, Bot, Paperclip, Maximize2, Minimize2, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';

/* -------------------------------------------------------------------------------------------------
 * LUMINA ORACLE AI ASSISTANT
 * -------------------------------------------------------------------------------------------------
 * A global, persistent AI companion available on every page.
 * Features:
 * - Floating Launcher Button (FAB)
 * - Glassmorphism & Premium UI
 * - Context-aware chat (mocked)
 * - Expandable/Minimizable window
 */

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function OracleAssistant() {
    const { user, currentOrg: organization } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const suggestions = [
        "Draft a Non-Disclosure Agreement",
        "Summarize active contracts",
        "Show expiring contracts",
        "What is the risky clause policy?"
    ];

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Hello ${user?.name?.split(' ')[0] || 'there'}! I'm Lumina Oracle, your AI legal companion. How can I assist you with your contracts today?`,
            timestamp: new Date()
        }
    ]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Real API Call with Context
            const result = await api.oracle.chat({
                query: text.trim(),
                contextUrl: typeof window !== 'undefined' ? window.location.href : undefined,
                organizationId: organization?.id
            });

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Oracle Error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm securely connected, but I couldn't reach the reasoning engine. Please try again or contact support.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">

            {/* EVENT AREA POINTER EVENTS RESTORE */}
            <div className={`pointer-events-auto transition-all duration-300 ease-out origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none hidden'}`}>
                {/* CYBERPUNK / GLASS CONTAINER */}
                <div
                    className={cn(
                        "bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col transition-all duration-500",
                        isExpanded ? "w-[600px] h-[80vh] rounded-2xl" : "w-[400px] h-[600px]"
                    )}
                >
                    {/* Header */}
                    <div className="h-16 bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-between px-5 py-4 shrink-0 relative overflow-hidden">
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer"></div>

                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                <Sparkles className="w-4 h-4 text-white" fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm tracking-wide">LUMINA ORACLE</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-[10px] text-white/80 font-medium">Online</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 relative z-10">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-2 hover:bg-white/10 rounded-full text-white/90 transition-colors"
                            >
                                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full text-white/90 transition-colors"
                            >
                                <ChevronDown size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth custom-scrollbar bg-slate-950/50"
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'assistant' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-700'}`}>
                                    {msg.role === 'assistant' ? <Bot size={16} className="text-white" /> : <span className="text-xs font-bold text-white">ME</span>}
                                </div>

                                {/* Bubble */}
                                <div
                                    className={cn(
                                        "max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap",
                                        msg.role === 'assistant'
                                            ? "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none"
                                            : "bg-orange-600 text-white rounded-tr-none shadow-orange-900/20"
                                    )}
                                >
                                    {msg.content.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
                                        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                                        if (match) {
                                            return (
                                                <a
                                                    key={i}
                                                    href={match[2]}
                                                    className="underline decoration-orange-400/50 hover:decoration-orange-400 hover:text-white transition-colors font-medium"
                                                >
                                                    {match[1]}
                                                </a>
                                            );
                                        }
                                        return part;
                                    })}
                                    <div className={`text-[9px] mt-1.5 font-medium opacity-50 ${msg.role === 'user' ? 'text-right' : ''}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {messages.length === 1 && (
                            <div className="grid grid-cols-1 gap-2 px-1 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                                <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider ml-1">Suggested Actions</p>
                                {suggestions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(action)}
                                        className="text-left text-sm bg-slate-800/50 hover:bg-slate-800 text-slate-300 p-3 rounded-xl border border-slate-700/50 hover:border-orange-500/30 transition-all hover:text-orange-400 group flex items-center justify-between"
                                    >
                                        {action}
                                        <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-orange-500" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                                    <Bot size={16} className="text-white" />
                                </div>
                                <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-0"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                        <div className="relative flex items-center bg-slate-800 rounded-xl border border-slate-700 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all shadow-inner">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Lumina anything..."
                                className="flex-1 bg-transparent border-none text-slate-200 placeholder:text-slate-500 focus:ring-0 text-sm px-4 py-3.5"
                                autoFocus
                            />
                            <div className="pr-2 flex items-center gap-1">
                                <button className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50">
                                    <Paperclip size={18} />
                                </button>
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim()}
                                    className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/20"
                                >
                                    <Send size={16} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                        <div className="text-center mt-2.5">
                            <p className="text-[10px] text-slate-500 font-medium">Powered by Lumina LLM v2.0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LAUNCHER BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto mt-4 group relative flex items-center justify-center w-16 h-16 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-white transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-gradient-to-tr from-orange-600 to-orange-400'}`}
            >
                {/* Ping Animation */}
                {!isOpen && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-20 animate-ping duration-[2000ms]"></span>
                )}

                {isOpen ? (
                    <X size={28} className="text-white" />
                ) : (
                    <Sparkles size={28} className="text-white fill-white/20" />
                )}
            </button>
        </div>
    );
}
