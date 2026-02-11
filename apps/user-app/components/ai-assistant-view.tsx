"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, AlertCircle, Search, ArrowRight } from "lucide-react";
import { Template } from "@repo/types";
import { Button, Badge } from "@repo/ui";

interface Message {
    role: "user" | "system";
    content: string;
    suggestions?: Template[];
    showExamples?: boolean;
    showSeeAll?: boolean;
}

export function AIAssistantView({ onTemplateSelect, templates, onShowAll }: { onTemplateSelect: (template: Template) => void, templates: Template[], onShowAll?: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "system", content: "Hi! I'm your AI Contract Assistant. Describe what kind of contract you need, and I'll find the best template for you." }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Enhanced Matching Logic
    const findMatches = (query: string): Template[] => {
        const lowerQ = query.toLowerCase().trim();
        if (!lowerQ) return [];

        // 1. Exact Name Match (High Priority)
        const exactMatches = templates.filter(t => t.name.toLowerCase() === lowerQ);
        if (exactMatches.length > 0) return exactMatches;

        // 2. Contains Name Match (Medium Priority)
        const nameMatches = templates.filter(t => t.name.toLowerCase().includes(lowerQ));
        if (nameMatches.length > 0) return nameMatches;

        // 3. Keyword / Category Mapping (Fuzzy / "LLM Cleaning" Simulation)
        const keywords: Record<string, string> = {
            "buy": "PURCHASE_ORDER",
            "purchase": "PURCHASE_ORDER",
            "order": "PURCHASE_ORDER",
            "goods": "PURCHASE_ORDER",

            "vendor": "VENDOR_AGREEMENT",
            "supplier": "VENDOR_AGREEMENT",
            "partner": "VENDOR_AGREEMENT",
            "onboarding": "VENDOR_AGREEMENT",

            "nda": "NDA",
            "confidential": "NDA",
            "disclosure": "NDA",
            "secret": "NDA",

            "hire": "SERVICE_AGREEMENT",
            "freelance": "SERVICE_AGREEMENT",
            "contractor": "SERVICE_AGREEMENT",
            "service": "SERVICE_AGREEMENT",

            "employee": "EMPLOYMENT",
            "job": "EMPLOYMENT",
            "work": "EMPLOYMENT",

            "lease": "LEASE",
            "rent": "LEASE"
        };

        const matchedCategories = Object.entries(keywords)
            .filter(([key]) => lowerQ.includes(key))
            .map(([, category]) => category);

        if (matchedCategories.length > 0) {
            // Find templates matching the inferred category
            return templates.filter(t => matchedCategories.includes(t.category));
        }

        // 4. Description Search (Low Priority)
        return templates.filter(t =>
            t.description?.toLowerCase().includes(lowerQ) ||
            t.code.toLowerCase().includes(lowerQ)
        );
    };

    const handleSend = async (textOverride?: string) => {
        const userText = textOverride || input;
        if (!userText.trim()) return;

        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userText }]);
        setIsTyping(true);

        // Simulate AI Latency
        setTimeout(() => {
            setIsTyping(false);

            const matches = findMatches(userText);

            // SUCCESS: Matches Found
            if (matches.length > 0) {
                setAttempts(0); // Reset strikes
                setMessages(prev => [...prev, {
                    role: "system",
                    content: matches.length === 1
                        ? `I found the perfect match based on "${userText}".`
                        : `I found ${matches.length} templates that match "${userText}". Please select one:`,
                    suggestions: matches
                }]);
                return;
            }

            // FAILURE: No Matches
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            if (newAttempts >= 3) {
                // Strike 3: Force "See All"
                setMessages(prev => [...prev, {
                    role: "system",
                    content: "It seems I'm having trouble finding the specific template you're looking for. Please browse our full catalog to select manually.",
                    showSeeAll: true
                }]);
            } else {
                // Strike 1 & 2: Ask for clarification + Examples
                setMessages(prev => [...prev, {
                    role: "system",
                    content: `I couldn't find a template matching "${userText}". Could you be more specific? You can try saying:`,
                    showExamples: true
                }]);
            }

        }, 1200);
    };

    return (
        <div className="flex flex-col min-h-[500px] max-h-[750px] border border-slate-200 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 bg-white animate-in fade-in zoom-in-95 duration-500 relative ring-1 ring-slate-100">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white ring-2 ring-white ring-offset-2 ring-offset-orange-50">
                        <Sparkles className="w-5 h-5 fill-white/20" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 tracking-tight">AI Contract Assistant</h3>
                        <p className="text-xs text-orange-600 font-bold tracking-wide flex items-center gap-1.5 uppercase">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            CLM Intelligence Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 scroll-smooth">
                {messages.length === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mt-4 sm:mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Initial Onboarding Chips */}
                        {[
                            { label: "Create NDA", icon: "🔒", desc: "Non-Disclosure Agreement", prompt: "I need a Non-Disclosure Agreement" },
                            { label: "Service Agreement", icon: "🤝", desc: "For Contractors/Freelancers", prompt: "I need a Service Agreement" },
                            { label: "Purchase Order", icon: "📦", desc: "Procurement of Goods", prompt: "Create a Purchase Order" },
                            { label: "Employment", icon: "💼", desc: "Full-time Offer Letter", prompt: "New Employment Contract" }
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={() => handleSend(item.prompt)}
                                className="group relative overflow-hidden p-5 bg-white border border-slate-200 rounded-2xl text-left hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-2xl mb-3 block transform group-hover:scale-110 transition-transform duration-300 origin-left">{item.icon}</span>
                                <span className="font-bold text-slate-900 block group-hover:text-orange-700 transition-colors">{item.label}</span>
                                <span className="text-xs text-slate-500 font-medium">{item.desc}</span>
                            </button>
                        ))}
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 sm:gap-4 animate-in slide-in-from-bottom-2 duration-500 fade-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-slate-900 text-white ring-2 ring-white" : "bg-white border border-slate-100 text-orange-600 ring-2 ring-slate-50"}`}>
                            {msg.role === "user" ? <User size={16} /> : <Bot size={18} />}
                        </div>

                        <div className="max-w-[85%] sm:max-w-[75%] space-y-3">
                            <div className={`p-4 sm:p-5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === "user"
                                ? "bg-slate-900 text-white rounded-tr-sm shadow-md"
                                : "bg-white text-slate-600 border border-slate-100 rounded-tl-sm shadow-sm"
                                }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>

                            {/* Template Suggestions Carousel */}
                            {msg.suggestions && msg.suggestions.length > 0 && (
                                <div className="grid gap-3">
                                    {msg.suggestions.map(tmpl => (
                                        <div
                                            key={tmpl.id}
                                            className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm hover:border-orange-200 hover:shadow-md hover:shadow-orange-100/50 transition-all flex justify-between items-center group cursor-pointer relative overflow-hidden"
                                            onClick={() => onTemplateSelect(tmpl)}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative">
                                                <h4 className="font-bold text-slate-900 group-hover:text-orange-700 transition-colors flex items-center gap-2">
                                                    {tmpl.name}
                                                    <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-orange-500">
                                                        <ArrowRight size={14} />
                                                    </span>
                                                </h4>
                                                <p className="text-xs text-slate-500 line-clamp-1 font-medium bg-slate-100 px-2 py-0.5 rounded-full w-fit mt-1">{tmpl.category}</p>
                                            </div>
                                            <Button size="sm" className="relative bg-white text-slate-900 border border-slate-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all">Select</Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fallback Examples */}
                            {msg.showExamples && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {["I want an NDA", "Standard Service Agreement", "Purchase Order for Goods"].map(ex => (
                                        <button
                                            key={ex}
                                            onClick={() => handleSend(ex)}
                                            className="px-4 py-2 bg-orange-50 text-orange-700 text-xs font-bold rounded-xl border border-orange-100 hover:bg-orange-100 hover:scale-105 hover:shadow-sm transition-all"
                                        >
                                            "{ex}"
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* See All CTA */}
                            {msg.showSeeAll && (
                                <button
                                    onClick={onShowAll}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/20 transition-all mt-2 w-full justify-center group"
                                >
                                    <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Browse Full Catalog
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-4 animate-in fade-in duration-300">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-100 flex-shrink-0 flex items-center justify-center text-orange-600 shadow-sm ring-2 ring-slate-50">
                            <Bot size={18} />
                        </div>
                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5 h-[48px] sm:h-[52px]">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-100 sticky bottom-0 z-20">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2 sm:gap-3 max-w-4xl mx-auto relative group"
                >
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Sparkles className="h-4 w-4 text-orange-500/50" />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your contract needs..."
                        className="flex-1 pl-10 pr-4 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 transition-all text-slate-900 placeholder-slate-400 font-medium text-sm sm:text-base"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="px-5 sm:px-6 bg-slate-900 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-slate-900 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg shadow-slate-900/10 flex items-center justify-center active:scale-95"
                    >
                        <Send size={18} className={input.trim() && !isTyping ? "text-orange-100" : ""} />
                    </button>
                </form>
            </div>
        </div>
    );
}
