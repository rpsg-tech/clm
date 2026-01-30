"use client";

import { useState, useRef, useEffect } from "react";
import { Wand2, Send, Bot, User, Check, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@repo/ui";

interface ContractAssistantSidebarProps {
    className?: string;
    embedded?: boolean;
}

export function ContractAssistantSidebar({ className = "", embedded = false }: ContractAssistantSidebarProps) {
    const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
        { role: 'ai', text: "I'm analyzing your contract in real-time. I can help you draft clauses, identify risks, or polish the language." }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        setMessages(prev => [...prev, { role: 'user', text: inputValue }]);
        setInputValue("");
        setIsTyping(true);

        // Mock Response
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, { role: 'ai', text: "I've reviewed that section. The indemnity clause looks standard, but you might want to limit the liability cap to 12 months of fees." }]);
        }, 1500);
    };

    return (
        <div className={`flex flex-col h-full bg-white ${embedded ? 'rounded-none border-0 shadow-none' : 'border border-slate-200 rounded-3xl shadow-xl animate-in fade-in slide-in-from-right-4 duration-700 h-[700px]'} overflow-hidden ${className}`}>
            {/* Header - Hide if embedded (handled by parent usually, but good to have fallback) */}
            {!embedded && (
                <div className="p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20 text-white">
                            <Wand2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 leading-tight">Contract Assistant</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-slate-50 relative scroll-smooth">
                {/* Initial Analysis Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Analysis complete</span>
                    </div>
                    <div className="space-y-2.5">
                        <div className="flex items-start gap-3 text-slate-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                            <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                            <span className="text-xs font-medium leading-relaxed">Detected 3 key clauses: Termination, Indemnity, Payment Terms.</span>
                        </div>
                        <div className="flex items-start gap-3 text-slate-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                            <span className="text-xs font-medium leading-relaxed">Missing: "Force Majeure" clause recommended.</span>
                        </div>
                    </div>
                </div>

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm border ${msg.role === 'user' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-orange-600'}`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                            ? 'bg-slate-900 text-white rounded-tr-none shadow-md'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3 animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center text-orange-600 shadow-sm">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-none p-3 flex items-center gap-1 h-[40px]">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative group">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask AI Assistant..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-orange-600/20 active:scale-95"
                    >
                        <Send size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
}
