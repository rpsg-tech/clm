"use client";

import { useState, useRef, useEffect } from "react";
import { Wand2, Send, Bot, User, Check, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@repo/ui";
import { api } from "@/lib/api-client";

interface ContractAssistantSidebarProps {
    className?: string;
    embedded?: boolean;
    contractId?: string;
    content?: string;
}

interface AnalysisResult {
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    keyTerms: Array<{ term: string, category: string, importance: string }>;
    issues: Array<{ severity: 'CRITICAL' | 'WARNING', title: string, description: string, clause?: string }>;
    suggestions: string[];
    summary: string;
}

export function ContractAssistantSidebar({ className = "", embedded = false, contractId, content }: ContractAssistantSidebarProps) {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const runAnalysis = async () => {
        if (!contractId && !content) return;
        setIsAnalyzing(true);
        try {
            let result: AnalysisResult | undefined;
            if (contractId) {
                result = await api.contracts.analyze(contractId);
            } else if (content) {
                result = await api.ai.analyze(content);
            } else {
                return;
            }

            if (!result) return;

            setAnalysis(result);
            setMessages(prev => [...prev, { role: 'ai', text: `I've finished analyzing the contract. I found ${result.issues.length} issues and gave it a risk score of ${result.riskScore}/10.` }]);
        } catch (error) {
            console.error('Analysis failed', error);
            setMessages(prev => [...prev, { role: 'ai', text: "Analysis failed. Please try again later." }]);
        } finally {
            setIsAnalyzing(false);
        }
    };
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

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue;
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInputValue("");
        setIsTyping(true);

        try {
            // Dedicated Document Assistant Call (Separated from Oracle)
            const result = await api.ai.chatDocument({
                query: userMessage,
                content: content || "No content provided",
            });

            setMessages(prev => [...prev, { role: 'ai', text: result.content }]);
        } catch (error) {
            console.error('Chat failed:', error);
            setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to the server. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
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
                {/* Dynamic Analysis Card */}
                {contractId && !analysis && !isAnalyzing && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Risk Check</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Run a deep analysis (GPT-4o) to find missing clauses and risks.
                        </p>
                        <Button
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                            variant="outline"
                            className="w-full text-xs h-8 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                        >
                            Run Analysis
                        </Button>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center py-8 space-y-3">
                        <div className="w-8 h-8 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-200 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-8 w-8 bg-orange-100 flex items-center justify-center text-orange-500">
                                <Wand2 size={16} className="animate-pulse" />
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-600">Analyzing Document...</p>
                    </div>
                )}

                {analysis && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Analysis Complete</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${analysis.riskLevel === 'HIGH' ? 'bg-red-100 text-red-600' :
                                analysis.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-600' :
                                    'bg-emerald-100 text-emerald-600'
                                }`}>
                                {analysis.riskLevel} RISK ({analysis.riskScore}/10)
                            </span>
                        </div>
                        <div className="space-y-2.5">
                            {analysis.issues.slice(0, 2).map((issue, i) => (
                                <div key={i} className="flex items-start gap-3 text-slate-600 bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                                    <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                    <span className="text-xs font-medium leading-relaxed">{issue.title}: {issue.description}</span>
                                </div>
                            ))}
                            {analysis.issues.length === 0 && (
                                <div className="flex items-start gap-3 text-slate-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                                    <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                                    <span className="text-xs font-medium leading-relaxed">No critical issues found. Good to go!</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
