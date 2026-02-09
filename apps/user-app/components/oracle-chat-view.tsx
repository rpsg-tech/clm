'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, FileText, TrendingUp, Clock, AlertCircle, Users, GitBranch, Zap, DollarSign, CheckCircle, XCircle } from 'lucide-react';

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

// Tier 1 Quick Action Chips - Organized by category
const quickActions = {
    contracts: [
        { icon: FileText, label: 'Pending drafts', query: 'show draft contracts', color: 'orange' },
        { icon: Clock, label: 'Expiring soon', query: 'show contracts expiring in 30 days', color: 'amber' }, // Explicit days hit regex
        { icon: CheckCircle, label: 'Finance approved', query: 'show finance approved contracts', color: 'green' },
        { icon: DollarSign, label: 'High value contracts', query: 'show contracts over 100000', color: 'emerald' }, // Explicit amount
    ],
    team: [
        { icon: Users, label: 'Legal team', query: 'show legal team', color: 'blue' },
        { icon: Users, label: 'Finance team', query: 'show finance team', color: 'indigo' },
        { icon: AlertCircle, label: 'Who can approve?', query: 'who can approve contracts', color: 'purple' },
        { icon: TrendingUp, label: 'Active users', query: 'count active users', color: 'violet' },
    ],
    versions: [
        { icon: GitBranch, label: 'Recent changes', query: 'show recent contract versions', color: 'pink' },
        { icon: FileText, label: 'Version history', query: 'show version history', color: 'rose' },
    ]
};

export default function OracleChatView() {
    const router = useRouter();
    const [messages, setMessages] = useState<OracleMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [usage, setUsage] = useState<Record<number, { used: number; limit: number }>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchUsage();
    }, []);

    const getCsrfToken = (): string | null => {
        if (typeof document === 'undefined') return null;
        const cookies = document.cookie.split(';');
        const csrfCookie = cookies.find(c => c.trim().startsWith('XSRF-TOKEN='));
        if (csrfCookie) {
            return csrfCookie.split('=')[1];
        }
        return null;
    };

    const fetchUsage = async () => {
        try {
            const csrfToken = getCsrfToken();
            const headers: Record<string, string> = {};
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }

            const res = await fetch('/api/oracle/usage', { headers });
            if (res.ok) {
                const data = await res.json();
                setUsage(data);
            }
        } catch (error) {
            console.error('Failed to fetch usage:', error);
        }
    };

    const handleSend = async (query?: string) => {
        const messageText = query || input.trim();
        if (!messageText || isLoading) return;

        const userMessage: OracleMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
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
                body: JSON.stringify({ query: messageText })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to get response');
            }

            const response = await res.json();

            const assistantMessage: OracleMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                type: response.type,
                data: response.data,
                meta: response.meta,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
            fetchUsage();
        } catch (error: any) {
            const errorMessage: OracleMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ Error: ${error.message}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
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
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    // Navigate to contract detail
    const handleContractClick = (contractId: string) => {
        router.push(`/dashboard/contracts/${contractId}`);
    };

    // Render clickable contract card
    const renderContractCard = (contract: any) => (
        <button
            key={contract.id}
            onClick={() => handleContractClick(contract.id)}
            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 hover:border-orange-500/50 hover:bg-slate-800/60 transition-all cursor-pointer group text-left"
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-100 text-sm group-hover:text-orange-400 transition-colors">{contract.title}</h4>
                <span className="text-xs text-slate-500">{contract.reference}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                    <span className="text-slate-500">Status:</span>
                    <span className="ml-2 text-slate-300">{contract.status}</span>
                </div>
                {contract.amount && (
                    <div>
                        <span className="text-slate-500">Amount:</span>
                        <span className="ml-2 text-slate-300">₹{contract.amount.toLocaleString()}</span>
                    </div>
                )}
            </div>
            <div className="mt-2 text-xs text-slate-500 group-hover:text-orange-400 transition-colors">
                Click to view details →
            </div>
        </button>
    );

    // Navigate to user list (since no specific profile page found)
    const handleUserClick = (userId: string) => {
        router.push(`/dashboard/users`);
    };

    // Navigate to version history
    const handleVersionClick = (contractId?: string, versionNumber?: number) => {
        if (contractId) {
            router.push(`/dashboard/contracts/${contractId}`);
        } else {
            router.push(`/dashboard/contracts`);
        }
    };


    // Render user card
    const renderUserCard = (user: any, index: number) => (
        <button
            key={index}
            onClick={() => handleUserClick(user.id)}
            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left group"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-slate-100 text-sm group-hover:text-blue-400 transition-colors">{user.name}</h4>
                    <p className="text-xs text-slate-500">{user.role || 'User'}</p>
                </div>
                {user.email && (
                    <span className="text-xs text-slate-600">{user.email}</span>
                )}
            </div>
        </button>
    );

    // Render version card  
    const renderVersionCard = (version: any, index: number) => (
        <button
            key={index}
            onClick={() => handleVersionClick(version.contractId, version.version)}
            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 hover:border-purple-500/50 hover:bg-slate-800/60 transition-all text-left group"
        >
            <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-purple-400" />
                <h4 className="font-semibold text-slate-100 text-sm group-hover:text-purple-400 transition-colors">Version {version.version}</h4>
            </div>
            {version.changes && (
                <p className="text-xs text-slate-400">{version.changes}</p>
            )}
            <p className="text-xs text-slate-600 mt-2">
                {new Date(version.createdAt).toLocaleDateString()}
            </p>
            <div className="mt-2 text-xs text-slate-500 group-hover:text-purple-400 transition-colors">
                Click to view details →
            </div>
        </button>
    );

    // Render quick action chip
    const renderQuickActionChip = (action: any, category: string) => {
        const Icon = action.icon;
        return (
            <button
                key={action.query}
                onClick={() => handleSend(action.query)}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-${action.color}-500/10 to-${action.color}-600/10 border border-${action.color}-500/30 hover:border-${action.color}-500/50 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all group whitespace-nowrap`}
            >
                <Icon className={`w-4 h-4 text-${action.color}-400 group-hover:scale-110 transition-transform`} />
                {action.label}
            </button>
        );
    };

    // Smart Suggestions Logic
    const getSuggestions = (msg: OracleMessage): { label: string, query: string }[] => {
        const suggestions = [];

        // Contract List Context
        if (msg.data?.contracts && msg.data.contracts.length > 0) {
            suggestions.push({ label: 'Filter by Legal', query: 'filter these by legal department' });
            suggestions.push({ label: 'Show expiring', query: 'show expiring contracts from this list' });
            suggestions.push({ label: 'Sort by value', query: 'sort these by amount high to low' });
        }

        // Count Context
        if (msg.type === 'count') {
            suggestions.push({ label: 'Show list', query: 'show me the list of these contracts' });
            suggestions.push({ label: 'Breakdown by status', query: 'breakdown by status' });
        }

        // Version Context
        if (msg.data?.versions && msg.data.versions.length > 0) {
            suggestions.push({ label: 'Compare latest', query: 'compare the last two versions' });
            suggestions.push({ label: 'Show details', query: 'show details of the latest version' });
        }

        // User Context
        if (msg.data?.users && msg.data.users.length > 0) {
            suggestions.push({ label: 'Active users only', query: 'show only active users' });
            suggestions.push({ label: 'Filter by role', query: 'group these users by role' });
        }

        return suggestions;
    };

    const renderSuggestionChips = (msg: OracleMessage) => {
        const suggestions = getSuggestions(msg);
        if (suggestions.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-500">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(s.query)}
                        className="px-3 py-1.5 bg-slate-800/40 hover:bg-orange-500/10 border border-slate-700/50 hover:border-orange-500/30 rounded-full text-xs text-slate-400 hover:text-orange-400 transition-all flex items-center gap-1 group"
                    >
                        <Sparkles className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        {s.label}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">LUMINA ORACLE</h1>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-xs text-orange-100">Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col gap-6 max-w-4xl">
                        {/* Greeting */}
                        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl rounded-tl-sm p-6 shadow-xl">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-100 mb-2">Welcome to Lumina Oracle! 👋</h2>
                                    <p className="text-slate-300 leading-relaxed">
                                        I'm your AI-powered legal assistant. Ask me about contracts, team members, version history, or use the quick actions below for instant results.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Categories */}
                        <div className="space-y-4">
                            {/* Contracts */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Contract Shortcuts
                                </h3>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                    {quickActions.contracts.map(action => renderQuickActionChip(action, 'contracts'))}
                                </div>
                            </div>

                            {/* Team */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Team Queries
                                </h3>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                    {quickActions.team.map(action => renderQuickActionChip(action, 'team'))}
                                </div>
                            </div>

                            {/* Versions */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <GitBranch className="w-4 h-4" />
                                    Version Tracking
                                </h3>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                    {quickActions.versions.map(action => renderQuickActionChip(action, 'versions'))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <div key={msg.id}>
                        {msg.role === 'user' ? (
                            <div className="flex justify-end">
                                <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-2xl shadow-lg">
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 max-w-3xl">
                                <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xl">
                                    <p className="text-sm text-slate-100 mb-2">{msg.content}</p>

                                    {/* Contract data */}
                                    {msg.data?.contracts && msg.data.contracts.length > 0 && (
                                        <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                                            {msg.data.contracts.slice(0, 10).map(renderContractCard)}
                                            {msg.data.contracts.length > 10 && (
                                                <p className="text-xs text-slate-500 text-center py-2">
                                                    + {msg.data.contracts.length - 10} more
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {msg.data?.contract && renderContractCard(msg.data.contract)}

                                    {/* User data */}
                                    {msg.data?.users && msg.data.users.length > 0 && (
                                        <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                                            {msg.data.users.map(renderUserCard)}
                                        </div>
                                    )}

                                    {/* Version data */}
                                    {msg.data?.versions && msg.data.versions.length > 0 && (
                                        <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                                            {msg.data.versions.map(renderVersionCard)}
                                        </div>
                                    )}

                                    {/* Changelog */}
                                    {msg.data?.changelog && (
                                        <div className="mt-3 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <GitBranch className="w-4 h-4 text-purple-400" />
                                                <h4 className="font-semibold text-purple-400 text-sm">
                                                    Version {msg.data.changelog.version}
                                                </h4>
                                            </div>
                                            <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                                                {JSON.stringify(msg.data.changelog.changes, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Count display */}
                                    {msg.type === 'count' && msg.data?.count !== undefined && (
                                        <div className="mt-3 inline-flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-3">
                                            <div className="text-3xl font-bold text-orange-400">{msg.data.count}</div>
                                            <div className="text-xs text-slate-400">results</div>
                                        </div>
                                    )}
                                </div>

                                {msg.meta && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 ml-2">
                                        {msg.meta.tier && getTierBadge(msg.meta.tier)}
                                        {msg.meta.scope && (
                                            <span className="px-2 py-0.5 bg-slate-800/50 rounded-full">
                                                {msg.meta.scope === 'ORG_WIDE' ? '🌐 Organization' : '👤 Personal'}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Smart Suggestions */}
                                {renderSuggestionChips(msg)}
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-2">
                        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex gap-2 items-center">
                                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                <span className="text-xs text-slate-400 ml-2">Oracle is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-slate-900/90 backdrop-blur border-t border-slate-800 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3 items-end">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ask about contracts, team, or versions..."
                            className="flex-1 bg-slate-800/50 border border-slate-700/50 focus:border-orange-500/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-medium transition-all shadow-lg hover:shadow-orange-500/20"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-slate-600">
                            💡 Tip: Use quick actions above for instant results
                        </p>
                        {Object.keys(usage).length > 0 && (
                            <div className="flex gap-3 text-xs text-slate-500">
                                {[1, 2, 3].map(tier => {
                                    const limit = usage[tier];
                                    if (!limit) return null;
                                    return (
                                        <span key={tier} className="flex items-center gap-1">
                                            <span className={tier === 1 ? 'text-green-400' : tier === 2 ? 'text-blue-400' : 'text-purple-400'}>
                                                T{tier}:
                                            </span>
                                            {limit.used}/{limit.limit}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
