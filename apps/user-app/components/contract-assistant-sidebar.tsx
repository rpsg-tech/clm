"use client";


import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, Check, AlertTriangle } from "lucide-react";

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
        <div className={`flex flex-col h-full bg-white ${embedded ? 'rounded-none border-0 shadow-none' : 'border border-gray-200 rounded-3xl shadow-sm animate-in fade-in slide-in-from-right-4 duration-700 h-[700px]'} overflow-hidden ${className}`}>
            {/* Header - Hide if embedded */}
            {!embedded && (
                <div className="p-5 border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200 text-white">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight">Contract Assistant</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-xs text-green-600 font-medium">Active Analysis</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-gray-50/30 scroll-smooth">
                {/* Initial Analysis Card */}
                <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-[0_4px_20px_rgb(249,115,22,0.08)] text-sm space-y-3 animate-in zoom-in-95 duration-500">
                    <p className="font-medium text-gray-900">Contract Health Check</p>
                    <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5 text-gray-600 bg-green-50/50 p-2.5 rounded-lg border border-green-100/50">
                            <Check size={14} className="text-green-600 mt-0.5 shrink-0" />
                            <span className="text-xs leading-relaxed">Key terms detected: Termination, Indemnity, Payment.</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-gray-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                            <span className="text-xs leading-relaxed">Missing: "Force Majeure" clause recommended for this region.</span>
                        </div>
                    </div>
                </div>

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-100 text-orange-600'}`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                            ? 'bg-gray-900 text-white rounded-tr-none shadow-gray-200'
                            : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3 animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center text-orange-600 shadow-sm">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none p-3 flex items-center gap-1 h-[40px]">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask Contract Assistant..."
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-gray-900 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-orange-200"
                    >
                        <Send size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
}
