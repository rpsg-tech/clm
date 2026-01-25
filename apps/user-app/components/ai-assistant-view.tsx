"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Template } from "@repo/types";

interface Message {
    role: "user" | "system";
    content: string;
    suggestion?: Template;
}

export function AIAssistantView({ onTemplateSelect, templates }: { onTemplateSelect: (template: Template) => void, templates: Template[] }) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "system", content: "Hi! I'm your AI Contract Assistant. Describe what kind of contract you need, and I'll find the best template for you." }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsTyping(true);

        // Simulate AI "thinking"
        setTimeout(() => {
            setIsTyping(false);

            // Dynamic keyword matching
            const lowerInput = userMsg.toLowerCase();
            const foundTemplate = templates.find(t =>
                t.name.toLowerCase().includes(lowerInput) ||
                (t.description && t.description.toLowerCase().includes(lowerInput)) ||
                (t.category && t.category.toLowerCase().includes(lowerInput)) ||
                t.code.toLowerCase().includes(lowerInput)
            );

            let responseContent = "I'm not sure which template fits best. You can browse all available templates in the next step.";

            if (foundTemplate) {
                responseContent = `Based on your request, I recommend the **${foundTemplate.name}**. It seems to match your needs perfectly.`;
            } else if (lowerInput.includes("buy") || lowerInput.includes("purchase") || lowerInput.includes("order") || lowerInput.includes("goods")) {
                const po = templates.find(t => t.category === "PURCHASE_ORDER");
                if (po) {
                    responseContent = "A **Purchase Order** seems appropriate for this transaction.";
                    // matched via fallback logic logic, so we assign it to the variable used in state update
                    // but we can't reassign const foundTemplate, so we just pass it directly
                    setMessages(prev => [...prev, { role: "system", content: responseContent, suggestion: po }]);
                    return;
                }
            } else if (lowerInput.includes("nda") || lowerInput.includes("confidential")) {
                const nda = templates.find(t => t.category === "NDA");
                if (nda) {
                    responseContent = "I recommend our standard **Non-Disclosure Agreement (NDA)** to protect your confidential information.";
                    setMessages(prev => [...prev, { role: "system", content: responseContent, suggestion: nda }]);
                    return;
                }
            }

            setMessages(prev => [...prev, { role: "system", content: responseContent, suggestion: foundTemplate }]);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-[650px] border border-gray-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white animate-in fade-in zoom-in-95 duration-500 relative">
            {/* Header */}
            <div className="bg-white/95 backdrop-blur-md p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200 text-white">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">AI Contract Assistant</h3>
                        <p className="text-xs text-orange-600 font-semibold tracking-wide flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            Powered by CLM Intelligence
                        </p>
                    </div>
                </div>
                <div className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full flex items-center gap-2 border border-green-100">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Online
                </div>
            </div>

            {/* Chat Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/30 scroll-smooth">
                {messages.length === 1 && (
                    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delayed-fade">
                        {[
                            { label: "Create Non-Disclosure Agreement", icon: "🔒", desc: "Protect confidential info" },
                            { label: "Hire a Contractor", icon: "🤝", desc: "Service agreement for freelancers" },
                            { label: "Draft Purchase Order", icon: "📦", desc: "Order goods or supplies" },
                            { label: "New Employment Contract", icon: "💼", desc: "Onboard a new employee" }
                        ].map((prompt) => (
                            <button
                                key={prompt.label}
                                onClick={() => { setInput(`I need to ${prompt.label.toLowerCase()}`); }}
                                className="p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-orange-300 hover:shadow-md transition-all group"
                            >
                                <span className="text-2xl mb-2 block">{prompt.icon}</span>
                                <span className="font-semibold text-gray-900 block group-hover:text-orange-600 transition-colors">{prompt.label}</span>
                                <span className="text-xs text-gray-500">{prompt.desc}</span>
                            </button>
                        ))}
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 animate-in slide-in-from-bottom-5 duration-500 fade-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-orange-600"}`}>
                            {msg.role === "user" ? <User size={18} /> : <Bot size={20} />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[75%] space-y-3`}>
                            <div className={`p-5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === "user" ? "bg-gray-900 text-white rounded-tr-none shadow-gray-200" : "bg-white text-gray-600 border border-gray-100 rounded-tl-none shadow-[0_2px_8px_rgb(0,0,0,0.02)]"}`}>
                                <p>{msg.content}</p>
                            </div>

                            {/* Template Suggestion Card */}
                            {msg.suggestion && (
                                <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-[0_4px_20px_rgb(249,115,22,0.1)] animate-in slide-in-from-bottom-2 duration-700 hover:border-orange-200 transition-colors cursor-pointer group" onClick={() => onTemplateSelect(msg.suggestion!)}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">{msg.suggestion.name}</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">{msg.suggestion.description}</p>
                                            <div className="inline-flex items-center text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                                Recommended Match
                                            </div>
                                        </div>
                                        <button
                                            className="whitespace-nowrap px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all shadow-md hover:shadow-lg group-hover:bg-orange-600"
                                        >
                                            Select
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex gap-4 animate-in fade-in duration-300">
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center text-orange-600 shadow-sm">
                            <Bot size={20} />
                        </div>
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5 h-[52px]">
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Sticky Bottom */}
            <div className="p-5 bg-white border-t border-gray-100 sticky bottom-0 z-20">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-3 max-w-4xl mx-auto relative"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your request here (e.g., 'I need a purchase order for IT equipment')..."
                        className="flex-1 px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10 transition-all text-gray-700 placeholder:text-gray-400 shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-gray-900 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-orange-200"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
