'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, Send, Bot, Paperclip, Maximize2, Minimize2, ChevronDown, ArrowRight, FileText, TrendingUp, Clock, AlertCircle, Users, GitBranch, Zap, DollarSign, CheckCircle } from 'lucide-react';
import { cn } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* -------------------------------------------------------------------------------------------------
 * LUMINA ORACLE AI ASSISTANT (Floating Widget)
 * -------------------------------------------------------------------------------------------------
 * A global, persistent AI companion available on every page.
 * Features:
 * - Floating Launcher Button (FAB)
 * - Glassmorphism & Premium UI
 * - Tier 1 Instant Queries (Contracts, Team, Versions)
 * - Clickable Results with Navigation
 */

interface OracleMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'count' | 'list' | 'detail' | 'chat';
    data?: {
        contracts?: any[];
        count?: number;
        contract?: any;
        users?: any[];
        versions?: any[];
        changelog?: any;
    };
    meta?: {
        tier: 1 | 2 | 3;
        tokensUsed?: number;
        cached?: boolean;
        functionCalled?: string;
        scope?: string;
        sources?: any[];
    };
    timestamp: Date;
}

// Tier 1 Quick Action Chips
const quickActions = {
    contracts: [
        { icon: Clock, label: 'Pending drafts', query: 'show draft contracts', color: 'orange' },
        { icon: Clock, label: 'Created last 2 days', query: 'contracts created in the last 2 days', color: 'indigo' },
        { icon: Clock, label: 'Expiring soon', query: 'show contracts expiring in 30 days', color: 'amber' },
        { icon: DollarSign, label: 'High value', query: 'show contracts over 100000', color: 'emerald' },
    ],
    team: [
        { icon: Users, label: 'Legal team', query: 'show legal team', color: 'blue' },
        { icon: Users, label: 'Active users', query: 'count active users', color: 'violet' },
    ],
    versions: [
        { icon: GitBranch, label: 'Latest changes', query: 'show recent contract versions', color: 'pink' },
    ]
};

export function OracleAssistant() {
    const router = useRouter();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<OracleMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Hello ${user?.name?.split(' ')[0] || 'there'}! I'm Lumina Oracle. How can I help?`,
            timestamp: new Date()
        }
    ]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isLoading]);

    const getCsrfToken = (): string | null => {
        if (typeof document === 'undefined') return null;
        const cookies = document.cookie.split(';');
        const csrfCookie = cookies.find(c => c.trim().startsWith('XSRF-TOKEN='));
        if (csrfCookie) {
            return csrfCookie.split('=')[1];
        }
        return null;
    };

    const handleSend = async (query?: string) => {
        const text = query || input.trim();
        if (!text) return;

        const userMsg: OracleMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const csrfToken = getCsrfToken();
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }

            const res = await fetch('/api/oracle/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({ query: text })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to get response');
            }

            const response = await res.json();

            const aiMsg: OracleMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                type: response.type,
                data: response.data,
                meta: response.meta,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            const errorMsg: OracleMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm securely connected, but I couldn't reach the reasoning engine. Please try again or contact support.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Navigation Handlers
    const handleContractClick = (contractId: string) => {
        router.push(`/dashboard/contracts/${contractId}`);
        // Optionally close or minimize on navigation
        // setIsOpen(false); 
    };

    const handleUserClick = () => {
        router.push(`/dashboard/users`);
    };

    const handleVersionClick = (contractId?: string) => {
        if (contractId) {
            router.push(`/dashboard/contracts/${contractId}`);
        } else {
            router.push(`/dashboard/contracts`);
        }
    };

    const getTierBadge = (tier: number) => {
        const badges = {
            1: { label: 'Instant', icon: Zap, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            2: { label: 'AI', icon: Sparkles, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            3: { label: 'Advanced', icon: Sparkles, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
        };
        const badge = badges[tier as keyof typeof badges];
        if (!badge) return null;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${badge.color}`}>
                <Icon className="w-2.5 h-2.5" />
                {badge.label}
            </span>
        );
    };

    // Render Helpers
    const renderContractCard = (contract: any) => (
        <button
            key={contract.id}
            onClick={() => handleContractClick(contract.id)}
            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-lg p-2.5 hover:border-orange-500/50 hover:bg-slate-800/60 transition-all cursor-pointer group text-left mb-2 active:scale-[0.98]"
        >
            <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-slate-100 text-[11px] group-hover:text-orange-400 transition-colors line-clamp-1">{contract.title}</h4>
                <span className="text-[9px] text-slate-500 shrink-0 ml-2 font-mono uppercase">{contract.reference}</span>
            </div>
            {contract.counterpartyName && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1.5 opacity-80">
                    <Users className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{contract.counterpartyName}</span>
                </div>
            )}
            <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1.5">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full ring-4 ring-opacity-10",
                        contract.status === 'ACTIVE' ? "bg-emerald-500 ring-emerald-500" :
                            contract.status === 'DRAFT' ? "bg-orange-500 ring-orange-500" :
                                "bg-slate-500 ring-slate-500"
                    )} />
                    <span className="text-slate-400 font-medium">{contract.status}</span>
                </div>
                <div className="flex items-center gap-2">
                    {contract.endDate && (
                        <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Exp: {contract.endDate}
                        </span>
                    )}
                    {contract.amount && (
                        <span className="text-orange-300/90 font-semibold drop-shadow-sm">₹{Number(contract.amount).toLocaleString('en-IN')}</span>
                    )}
                </div>
            </div>
        </button>
    );

    const renderUserCard = (user: any, index: number) => (
        <button
            key={index}
            onClick={handleUserClick}
            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-lg p-2 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left group mb-2"
        >
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {user.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-100 text-xs group-hover:text-blue-400 transition-colors truncate">{user.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{user.role || 'User'}</p>
                </div>
            </div>
        </button>
    );

    const renderVersionCard = (version: any, index: number) => (
        <button
            key={index}
            onClick={() => handleVersionClick(version.contractId)}
            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-lg p-2.5 hover:border-purple-500/50 hover:bg-slate-800/60 transition-all text-left group mb-2"
        >
            <div className="flex items-center gap-1.5 mb-1">
                <GitBranch className="w-3 h-3 text-purple-400" />
                <h4 className="font-semibold text-slate-100 text-xs group-hover:text-purple-400 transition-colors">v{version.version}</h4>
                <span className="text-[10px] text-slate-500 ml-auto">{new Date(version.createdAt).toLocaleDateString()}</span>
            </div>
            {renderVersionChanges(version)}
        </button>
    );

    const renderVersionChanges = (version: any) => {
        try {
            // 1. Try to use raw changeLog object if available, otherwise parse string
            let log = version.changeLog;
            if (!log && typeof version.changes === 'string' && version.changes.startsWith('{')) {
                log = JSON.parse(version.changes);
            }

            // If we still don't have a structured log, fall back to plain text
            if (!log || !log.changes) {
                return version.changes ? (
                    <p className="text-[10px] text-slate-400 line-clamp-2">{version.changes}</p>
                ) : null;
            }

            // 2. Aggregate Stats
            const stats = log.changes.reduce((acc: any, change: any) => {
                const diff = change.diffStats || { additions: 0, deletions: 0 };
                acc.add += diff.additions || 0;
                acc.del += diff.deletions || 0;
                return acc;
            }, { add: 0, del: 0 });

            // 3. Extract Field Names (if any field changes)
            const fieldChanges = log.changes
                .filter((c: any) => c.changeType === 'field' || c.fieldName)
                .map((c: any) => c.fieldName || 'Content')
                .slice(0, 3);

            return (
                <div className="mt-1.5 space-y-1.5">
                    {/* Stats Badges */}
                    <div className="flex items-center gap-2">
                        {stats.add > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[9px] font-medium text-green-400">
                                +{stats.add}
                            </span>
                        )}
                        {stats.del > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-medium text-red-400">
                                -{stats.del}
                            </span>
                        )}
                        {stats.add === 0 && stats.del === 0 && (
                            <span className="text-[9px] text-slate-500 italic">No content changes</span>
                        )}
                    </div>

                    {/* Field Changes Summary */}
                    {fieldChanges.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {fieldChanges.map((field: string, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[9px] text-slate-300 border border-slate-600/50">
                                    {field}
                                </span>
                            ))}
                            {fieldChanges.length > 2 && (
                                <span className="text-[9px] text-slate-500 self-center">+ more</span>
                            )}
                        </div>
                    )}
                </div>
            );
        } catch (e) {
            // Fallback for parsing errors
            return <p className="text-[10px] text-slate-400 line-clamp-2">{String(version.changes)}</p>;
        }
    };

    const renderQuickActionChip = (action: any) => {
        const Icon = action.icon;
        return (
            <button
                key={action.query}
                onClick={() => handleSend(action.query)}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-${action.color}-500/50 rounded-lg transition-all group shrink-0`}
            >
                <Icon className={`w-3.5 h-3.5 text-${action.color}-400 group-hover:scale-110 transition-transform`} />
                <span className="text-xs text-slate-300 group-hover:text-white whitespace-nowrap">{action.label}</span>
            </button>
        );
    };

    // Smart Suggestions Logic
    const getSuggestions = (msg: OracleMessage): { label: string, query: string }[] => {
        const suggestions = [];

        // Contract List Context
        if (msg.data?.contracts) {
            // Case 0: No Results - Recovery Options
            if (msg.data.contracts.length === 0) {
                suggestions.push({ label: 'Show all', query: 'show all contracts' });
                suggestions.push({ label: 'Show drafts', query: 'show draft contracts' });
            }
            // Case 1: Single Result - Deep Dive
            else if (msg.data.contracts.length === 1) {
                const contract = msg.data.contracts[0];
                suggestions.push({ label: 'Show versions', query: `show versions of ${contract.reference}` });
                suggestions.push({ label: 'Summarize', query: `summarize contract ${contract.reference}` });
            }
            // Case 2: List - Filtering & Sorting
            else {
                suggestions.push({ label: 'Show pending', query: 'show contracts pending legal' });
                suggestions.push({ label: 'Show expiring', query: 'show contracts expiring in 30 days' });
                suggestions.push({ label: 'Show first', query: `show details of ${msg.data.contracts[0].reference}` });
            }
        }

        // Count Context
        if (msg.type === 'count') {
            suggestions.push({ label: 'Show list', query: 'show all contracts' });
            suggestions.push({ label: 'Breakdown status', query: 'show contracts by status' });
        }

        // Version Context
        if (msg.data?.versions && msg.data.versions.length > 0) {
            // Use reference from payload if available, or try to extract from first version's contractId (less reliable without map)
            // Fallback to generic query only if absolutely necessary, but prefer specific.
            const ref = (msg.data as any).reference;

            if (ref) {
                suggestions.push({ label: 'Compare latest', query: `compare the last two versions of ${ref}` });
                suggestions.push({ label: 'Details', query: `show details of the latest version of ${ref}` });
            } else {
                // If backend hasn't updated yet or reference missing, try to be safe or prompt user
                suggestions.push({ label: 'Compare latest', query: 'compare the last two versions' });
                suggestions.push({ label: 'Details', query: 'show details of the latest version' });
            }
        }

        // User Context
        if (msg.data?.users && msg.data.users.length > 0) {
            suggestions.push({ label: 'Active only', query: 'show only active users' });
            suggestions.push({ label: 'By role', query: 'group these users by role' });
        }

        return suggestions;
    };

    const renderSuggestionChips = (msg: OracleMessage) => {
        const suggestions = getSuggestions(msg);
        if (suggestions.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-500">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(s.query)}
                        className="px-2 py-1 bg-slate-800/40 hover:bg-orange-500/10 border border-slate-700/50 hover:border-orange-500/30 rounded-md text-[10px] text-slate-400 hover:text-orange-400 transition-all flex items-center gap-1 group"
                    >
                        <Sparkles className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
                        {s.label}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">

            {/* EVENT AREA POINTER EVENTS RESTORE */}
            <div className={`pointer-events-auto transition-all duration-300 ease-out origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none hidden'}`}>
                {/* CYBERPUNK / GLASS CONTAINER */}
                <div
                    className={cn(
                        "bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col transition-all duration-500",
                        isExpanded ? "w-[600px] h-[80vh] rounded-2xl" : "w-[380px] h-[600px]"
                    )}
                >
                    {/* Header */}
                    <div className="h-14 bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-between px-4 py-3 shrink-0 relative overflow-hidden">
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer"></div>

                        <div className="flex items-center gap-2.5 relative z-10">
                            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                <Sparkles className="w-3.5 h-3.5 text-white" fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xs tracking-wide">LUMINA ORACLE</h3>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-[10px] text-white/80 font-medium">Online</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 relative z-10">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1.5 hover:bg-white/10 rounded-full text-white/90 transition-colors"
                            >
                                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/10 rounded-full text-white/90 transition-colors"
                            >
                                <ChevronDown size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar bg-slate-950/50"
                    >
                        {messages.length === 1 && (
                            <div className="mb-4">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Actions</p>
                                <div className="flex flex-wrap gap-2">
                                    {[...quickActions.contracts, ...quickActions.team].slice(0, 4).map(action => renderQuickActionChip(action))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'assistant' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-700'}`}>
                                    {msg.role === 'assistant' ? <Bot size={14} className="text-white" /> : <span className="text-[10px] font-bold text-white">ME</span>}
                                </div>

                                {/* Bubble */}
                                <div className="flex flex-col gap-1 max-w-[85%]">
                                    <div
                                        className={cn(
                                            "p-3 rounded-2xl text-sm leading-relaxed shadow-sm prose prose-invert prose-sm",
                                            msg.role === 'assistant'
                                                ? "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none"
                                                : "bg-orange-600 text-white rounded-tr-none shadow-orange-900/20"
                                        )}
                                    >
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Assistant Rich Data */}
                                    {msg.role === 'assistant' && (
                                        <div className="space-y-2">
                                            {/* Tier Badge */}
                                            {msg.meta?.tier && (
                                                <div className="flex justify-start">
                                                    {getTierBadge(msg.meta.tier)}
                                                </div>
                                            )}

                                            {/* Contracts */}
                                            {msg.data?.contracts && msg.data.contracts.length > 0 && (
                                                <div className="mt-1 space-y-1">
                                                    {msg.data.contracts.slice(0, 3).map(renderContractCard)}
                                                    {msg.data.contracts.length > 3 && (
                                                        <p className="text-[10px] text-slate-500 text-center py-1 cursor-pointer hover:text-orange-400">
                                                            View {msg.data.contracts.length - 3} more...
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {msg.data?.contract && renderContractCard(msg.data.contract)}

                                            {/* Users */}
                                            {msg.data?.users && msg.data.users.length > 0 && (
                                                <div className="mt-1 space-y-1">
                                                    {msg.data.users.slice(0, 4).map(renderUserCard)}
                                                </div>
                                            )}

                                            {/* Versions */}
                                            {msg.data?.versions && msg.data.versions.length > 0 && (
                                                <div className="mt-1 space-y-1">
                                                    {msg.data.versions.slice(0, 3).map(renderVersionCard)}
                                                </div>
                                            )}

                                            {/* RAG Sources / Citations */}
                                            {msg.meta?.sources && msg.meta.sources.length > 0 && (
                                                <div className="mt-2 text-left">
                                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-orange-400" />
                                                        Sources Used
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {msg.meta.sources.map((source: any, idx: number) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => handleContractClick(source.contract.id)}
                                                                className="w-full bg-slate-800/40 border border-slate-700/50 rounded-lg p-2 hover:border-orange-500/50 hover:bg-slate-800/60 transition-all text-left group"
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <h4 className="font-semibold text-slate-200 text-[11px] group-hover:text-orange-400 transition-colors line-clamp-1">
                                                                        {source.contract?.title || 'Unknown Contract'}
                                                                    </h4>
                                                                    <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 shrink-0 ml-2">
                                                                        {(source.similarity * 100).toFixed(0)}% Match
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 line-clamp-2 italic border-l-2 border-slate-700 pl-2">
                                                                    "{source.text}"
                                                                </p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Count */}
                                            {msg.type === 'count' && msg.data?.count !== undefined && (
                                                <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1.5 mt-1">
                                                    <div className="text-lg font-bold text-orange-400">{msg.data.count}</div>
                                                    <div className="text-[10px] text-slate-400">results found</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Smart Suggestions */}
                                    {msg.role === 'assistant' && renderSuggestionChips(msg)}

                                    <div className={`text-[9px] font-medium opacity-50 ${msg.role === 'user' ? 'text-right' : ''}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                                    <Bot size={14} className="text-white" />
                                </div>
                                <div className="bg-slate-800 border border-slate-700 px-3 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1">
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-0"></div>
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-300"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-slate-900 border-t border-slate-800">
                        <div className="relative flex items-center bg-slate-800 rounded-xl border border-slate-700 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all shadow-inner">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Lumina anything..."
                                className="flex-1 bg-transparent border-none text-slate-200 placeholder:text-slate-500 focus:ring-0 text-xs px-3 py-3"
                                autoFocus
                            />
                            <div className="pr-1.5 flex items-center gap-0.5">
                                <button className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50">
                                    <Paperclip size={16} />
                                </button>
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim()}
                                    className="p-1.5 bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                >
                                    <Send size={14} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-[9px] text-slate-500 font-medium">Powered by Lumina LLM v2.0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LAUNCHER BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto mt-4 group relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-white transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-0 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-gradient-to-tr from-orange-600 to-orange-400'}`}
            >
                {/* Ping Animation */}
                {!isOpen && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-20 animate-ping duration-[2000ms]"></span>
                )}

                {isOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <Sparkles size={24} className="text-white fill-white/20" />
                )}
            </button>
        </div>
    );
}
