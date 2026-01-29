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
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 scroll-smooth">
                {messages.length === 1 && (
                    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Initial Onboarding Chips */}
                        {[
                            { label: "Create NDA", icon: "🔒", prompt: "I need a Non-Disclosure Agreement" },
                            { label: "Service Agreement", icon: "🤝", prompt: "I need a Service Agreement" },
                            { label: "Purchase Order", icon: "📦", prompt: "Create a Purchase Order" },
                            { label: "Employment", icon: "💼", prompt: "New Employment Contract" }
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={() => handleSend(item.prompt)}
                                className="p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-orange-300 hover:shadow-md transition-all group"
                            >
                                <span className="text-xl mb-2 block">{item.icon}</span>
                                <span className="font-semibold text-gray-900 block group-hover:text-orange-600 transition-colors">{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 animate-in slide-in-from-bottom-2 duration-500 fade-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-orange-600"}`}>
                            {msg.role === "user" ? <User size={18} /> : <Bot size={20} />}
                        </div>

                        <div className="max-w-[80%] space-y-3">
                            <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === "user" ? "bg-gray-900 text-white rounded-tr-none" : "bg-white text-gray-600 border border-gray-100 rounded-tl-none"}`}>
                                <p>{msg.content}</p>
                            </div>

                            {/* Template Suggestions Carousel */}
                            {msg.suggestions && msg.suggestions.length > 0 && (
                                <div className="grid gap-3">
                                    {msg.suggestions.map(tmpl => (
                                        <div key={tmpl.id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm hover:border-orange-200 transition-all flex justify-between items-center group cursor-pointer" onClick={() => onTemplateSelect(tmpl)}>
                                            <div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{tmpl.name}</h4>
                                                <p className="text-xs text-gray-500 line-clamp-1">{tmpl.category}</p>
                                            </div>
                                            <Button size="sm" variant="secondary" className="group-hover:bg-orange-100 group-hover:text-orange-700">Select</Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fallback Examples */}
                            {msg.showExamples && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {["I want an NDA", "Standard Service Agreement", "Purchase Order for Goods"].map(ex => (
                                        <button
                                            key={ex}
                                            onClick={() => handleSend(ex)}
                                            className="px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-100 hover:bg-orange-100 transition-colors"
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
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md mt-2 w-full justify-center"
                                >
                                    <Search className="w-4 h-4" />
                                    Browse All Templates
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-4">
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

            {/* Input Area */}
            <div className="p-5 bg-white border-t border-gray-100 sticky bottom-0 z-20">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-3 max-w-4xl mx-auto relative"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your request here..."
                        className="flex-1 px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10 transition-all text-gray-700"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-gray-900 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
