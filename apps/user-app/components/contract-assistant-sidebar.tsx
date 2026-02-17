"use client";

import { useState, useRef, useEffect } from "react";
import {
    Wand2, Send, Bot, User, Check, AlertTriangle, Sparkles,
    Copy, CheckCheck, MessageSquare, ShieldAlert, FileText,
    RotateCcw, ArrowRight
} from "lucide-react";
import { Button, cn } from "@repo/ui";
import { api } from "@/lib/api-client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContractAssistantSidebarProps {
    className?: string;
    embedded?: boolean;
    contractId?: string;
    content?: string;
    details?: any;
    versionData?: any;
}

interface AnalysisResult {
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    keyTerms: Array<{ term: string, category: string, importance: string }>;
    issues: Array<{ severity: 'CRITICAL' | 'WARNING', title: string, description: string, clause?: string }>;
    suggestions: string[];
    summary: string;
}

const QUICK_ACTIONS = [
    { label: "Executive Summary", icon: <FileText size={14} />, prompt: "Provide a concise executive summary of this contract, including the purpose, parties, and key dates." },
    { label: "Obligations & Deadlines", icon: <ShieldAlert size={14} />, prompt: "Extract all key obligations and specific deadlines mentioned in this contract." },
    { label: "Compliance Check", icon: <Check size={14} />, prompt: "Assess if this contract complies with standard legal terms and highlight any missing typical clauses." },
    { label: "Risk Mitigation", icon: <ShieldAlert size={14} />, prompt: "Analyze the risks and suggest specific mitigation clauses or amendments." },
];

const GROUNDING_INSTRUCTIONS = `
### SYSTEM GROUNDING INSTRUCTIONS (STRICT)
1. **Source Limitation**: You are an AI Legal Expert assigned to this specific contract. You must ONLY use the provided "CONTRACT METADATA (FACTS)" and "CONTRACT CONTENT" blocks.
2. **No Hallucinations**: If the requested information is not explicitly stated or logically derivable from the provided text, state: "I cannot find this information in the current contract." 
3. **No External Knowledge**: Do not answer general questions (e.g., "Who is the President?", "What is 2+2?", "How do I bake a cake?"). If asked, politely decline and remind the user that you are grounded only to this contract.
4. **Fact Primacy**: Always prioritize the "CONTRACT METADATA (FACTS)" block for parties, dates, and commercial values, as these represent the entered system of record.
5. **Tone**: Be professional, precise, and objective. Cite specific sections or clauses when possible.
`;

export function ContractAssistantSidebar({
    className = "",
    embedded = false,
    contractId,
    content,
    details,
    versionData
}: ContractAssistantSidebarProps) {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAllIssues, setShowAllIssues] = useState(false);
    const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
        { role: 'ai', text: "I am your AI Contract Expert, grounded specifically to this document. How can I assist you today?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

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
            setMessages(prev => [...prev, { role: 'ai', text: `### Analysis Complete\nI've finished analyzing the contract. I found **${result.issues.length} issues** and gave it a risk score of **${result.riskScore}/10**.` }]);
        } catch (error) {
            console.error('Analysis failed', error);
            setMessages(prev => [...prev, { role: 'ai', text: "Analysis failed. Please try again later." }]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSend = async (overrideText?: string) => {
        const userMessage = overrideText || inputValue;
        if (!userMessage.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        if (!overrideText) setInputValue("");
        setIsTyping(true);

        try {
            // Construct enhanced context
            let enhancedContext = content || "No content provided";

            // 1. Injected Metadata Facts
            if (details) {
                const metadataBlock = `
### CONTRACT METADATA (FACTS)
- **Document Title**: ${details.title || 'N/A'}
- **Party A (User Entity)**: CLM Enterprise User
- **Party B (Counterparty)**: ${details.counterpartyName || details.counterpartyBusinessName || 'N/A'}
- **Contact Email**: ${details.counterpartyEmail || 'N/A'}
- **Commercial Value**: ${details.amount ? `₹${Number(details.amount).toLocaleString('en-IN')}` : 'N/A'}
- **Execution/Start Date**: ${details.startDate ? new Date(details.startDate).toLocaleDateString() : 'N/A'}
- **Expiry/End Date**: ${details.endDate ? new Date(details.endDate).toLocaleDateString() : 'N/A'}
- **Current Status**: ${details.status?.replace(/_/g, ' ') || 'N/A'}
- **Approval History**: ${details.approvals?.length > 0
                        ? details.approvals.map((a: any) => `[${a.type}] ${a.status} by ${a.assignedUser?.name || 'Manager'} ${a.updatedAt ? `on ${new Date(a.updatedAt).toLocaleDateString()}` : ''} ${a.comment ? `(Comment: ${a.comment})` : ''}`).join('; ')
                        : 'No approval history available.'}
`;
                enhancedContext = metadataBlock + "\n\n" + enhancedContext;
            }

            // 2. Version Diff Info
            if (versionData) {
                const versionBlock = `
### VERSIONING / CHANGE HISTORY
${versionData.changelog || versionData.summary || 'Significant changes detected between current and previous versions.'}
`;
                enhancedContext = versionBlock + "\n\n" + enhancedContext;
            }

            // 3. Final Grounding & Composition
            const fullSystemPrompt = GROUNDING_INSTRUCTIONS + "\n\n" + enhancedContext;

            const result = await api.ai.chatDocument({
                query: userMessage,
                content: fullSystemPrompt,
            });

            setMessages(prev => [...prev, { role: 'ai', text: result.content }]);
        } catch (error) {
            console.error('Chat failed:', error);
            setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to the server. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className={`flex flex-col h-full bg-white ${embedded ? 'rounded-none border-0 shadow-none' : 'border border-slate-200 rounded-3xl shadow-xl animate-in fade-in slide-in-from-right-4 duration-700 h-[700px]'} overflow-hidden ${className}`}>
            {/* Header */}
            {!embedded && (
                <div className="p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20 text-white">
                            <Wand2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 leading-tight">Contract Assistant</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="relative flex h-2 w-2">
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
                {/* Compact Onboarding / Quick Actions */}
                {messages.length <= 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-wrap gap-2">
                            {QUICK_ACTIONS.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(action.prompt)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-orange-300 hover:bg-orange-50 transition-all group shadow-sm"
                                >
                                    <span className="text-orange-500 group-hover:scale-110 transition-transform">
                                        {action.icon}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-700">{action.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Subtle Risk Check Trigger */}
                        {contractId && !analysis && !isAnalyzing && (
                            <div className="flex items-center justify-between p-3 bg-orange-50/50 border border-orange-100 rounded-xl group/risk cursor-pointer hover:bg-orange-50 transition-colors" onClick={runAnalysis}>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-[11px] font-bold text-orange-800 uppercase tracking-tight">Run Deep Analysis</span>
                                </div>
                                <ArrowRight size={14} className="text-orange-400 group-hover/risk:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </div>
                )}

                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-6 space-y-2">
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analyzing Risks</p>
                    </div>
                )}

                {analysis && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md animate-in fade-in zoom-in-95 duration-500">
                        {/* Header with Visual Gauge */}
                        <div className="p-4 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${analysis.riskScore > 7 ? 'bg-red-500' : analysis.riskScore > 4 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Analysis Result</span>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm",
                                    analysis.riskScore > 7 ? 'bg-red-500 text-white shadow-red-200' :
                                        analysis.riskScore > 4 ? 'bg-amber-500 text-white shadow-amber-200' :
                                            'bg-emerald-500 text-white shadow-emerald-200'
                                )}>
                                    {analysis.riskLevel}-Risk Detected
                                </span>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Risk Gauge */}
                                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="32" cy="32" r="28"
                                            stroke="currentColor"
                                            strokeWidth="5"
                                            fill="transparent"
                                            className="text-slate-100"
                                        />
                                        <circle
                                            cx="32" cy="32" r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="transparent"
                                            strokeDasharray={175.92}
                                            strokeDashoffset={175.92 - (175.92 * analysis.riskScore) / 10}
                                            strokeLinecap="round"
                                            className={cn(
                                                "transition-all duration-1000 ease-out",
                                                analysis.riskScore > 7 ? 'text-red-500' : analysis.riskScore > 4 ? 'text-amber-500' : 'text-emerald-500'
                                            )}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-lg font-black text-slate-900 leading-none">{analysis.riskScore}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">/ 10</span>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        This contract shows signs of **{analysis.riskLevel.toLowerCase()}** legal risk. We found **{analysis.issues.length} specific issues** that may require negotiation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Critical Issues List */}
                        <div className="p-4 space-y-3 bg-white">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Key Findings</div>
                            {(showAllIssues ? analysis.issues : analysis.issues.slice(0, 3)).map((issue: any, i: number) => {
                                // Robust data extraction
                                const title = typeof issue === 'string' ? 'Observation' :
                                    (issue.title || issue.issue || issue.name || issue.recommendation || 'Legal Observation');
                                const description = typeof issue === 'string' ? issue :
                                    (issue.description || issue.text || issue.desc || issue.clause || 'Review this section for potential risks.');

                                return (
                                    <div key={i} className={cn(
                                        "flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm group/issue animate-in slide-in-from-bottom-2 duration-300",
                                        (issue.severity === 'CRITICAL' || issue.importance === 'HIGH')
                                            ? 'bg-red-50/50 border-red-100 hover:border-red-200'
                                            : 'bg-amber-50/50 border-amber-100 hover:border-amber-200'
                                    )}>
                                        <div className={cn(
                                            "mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center shrink-0",
                                            (issue.severity === 'CRITICAL' || issue.importance === 'HIGH') ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                        )}>
                                            <AlertTriangle size={12} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-[12px] font-bold text-slate-800 leading-tight group-hover/issue:text-orange-600 transition-colors">
                                                {title}
                                            </h4>
                                            <div className="text-xs text-slate-600 leading-relaxed pr-2">
                                                {description}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {analysis.issues.length > 3 && (
                                <button
                                    onClick={() => setShowAllIssues(!showAllIssues)}
                                    className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-600 hover:bg-slate-50 rounded-lg transition-all border border-dashed border-slate-200 mt-2"
                                >
                                    {showAllIssues ? 'Show Less' : `View ${analysis.issues.length - 3} more issues`}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300 group`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm border ${msg.role === 'user' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-orange-600'}`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                        </div>
                        <div className="flex flex-col gap-1 max-w-[85%]">
                            <div className={`relative rounded-2xl p-4 text-sm shadow-sm prose prose-sm prose-slate border ${msg.role === 'user'
                                ? 'bg-slate-900 text-white rounded-tr-none shadow-md border-slate-900'
                                : 'bg-white border-slate-200 text-slate-700 rounded-tl-none'
                                }`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ children }) => <p className={`m-0 leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>{children}</p>,
                                        ul: ({ children }) => <ul className="my-2 pl-4 list-disc">{children}</ul>,
                                        ol: ({ children }) => <ol className="my-2 pl-4 list-decimal">{children}</ol>,
                                        li: ({ children }) => <li className="mb-1">{children}</li>,
                                        h1: ({ children }) => <h1 className="text-base font-bold my-2">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-sm font-bold my-2">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-xs font-bold my-1 uppercase tracking-wider">{children}</h3>,
                                        strong: ({ children }) => <strong className="font-bold text-orange-600">{children}</strong>,
                                        code: ({ children }) => <code className="bg-slate-100 px-1 rounded text-pink-600 font-mono text-[11px]">{children}</code>,
                                        table: ({ children }) => (
                                            <div className="overflow-x-auto my-2 border rounded-lg">
                                                <table className="min-w-full divide-y divide-slate-200">{children}</table>
                                            </div>
                                        ),
                                        th: ({ children }) => <th className="px-2 py-1 bg-slate-50 text-left text-[10px] font-bold text-slate-500 uppercase">{children}</th>,
                                        td: ({ children }) => <td className="px-2 py-1 text-[11px] border-t">{children}</td>
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>

                                {msg.role === 'ai' && (
                                    <button
                                        onClick={() => copyToClipboard(msg.text, idx)}
                                        className="absolute -right-10 top-0 p-2 text-slate-400 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                                        title="Copy to clipboard"
                                    >
                                        {copiedIndex === idx ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
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
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative group flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask AI Assistant..."
                            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm font-medium placeholder:text-slate-400 shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isTyping}
                            className="absolute right-2 top-2 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                    {messages.length > 2 && (
                        <button
                            type="button"
                            onClick={() => setMessages([{ role: 'ai', text: "Chat cleared. How else can I help?" }])}
                            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            title="Reset chat"
                        >
                            <RotateCcw size={18} />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
