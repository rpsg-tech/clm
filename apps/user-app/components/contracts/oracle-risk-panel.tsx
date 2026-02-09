'use client';

import { useState, useRef, useEffect } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { mockAiChat, type AiChatMessage } from '@/lib/ai-mock';
import { cn } from '@repo/ui';

interface OracleRiskPanelProps {
    contractId: string;
}

const MOCK_RISK_CARDS = [
    {
        type: 'critical' as const,
        icon: 'gpp_maybe',
        label: 'Critical Insight',
        title: 'Liability Cap Below Standard',
        description:
            'Section 6.2 limits liability to 1x annual fees. Industry standard for this contract type is 2-3x. This exposes the organization to significant financial risk in case of breach.',
        action: 'Review Clause',
    },
    {
        type: 'warning' as const,
        icon: 'warning',
        label: 'Compliance Warning',
        title: 'Missing GDPR Addendum',
        description:
            'No Data Processing Agreement (DPA) found. EU counterparties require GDPR compliance documentation per Regulation 2016/679 Article 28.',
        action: 'Add DPA Template',
    },
    {
        type: 'success' as const,
        icon: 'check_circle',
        label: 'Clause Match',
        title: 'Termination Clause Verified',
        description:
            'Section 9 termination provisions match approved playbook v2.1. Notice period (60 days) and cure period (30 days) are within acceptable range.',
        action: 'View Details',
    },
];

const SUGGESTED_ACTIONS = [
    {
        title: 'Generate Risk Report',
        subtitle: 'Full compliance analysis as PDF',
    },
    {
        title: 'Compare with Playbook',
        subtitle: 'Check all clauses against standards',
    },
];

export function OracleRiskPanel({ contractId: _contractId }: OracleRiskPanelProps) {
    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: AiChatMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const aiResponse = await mockAiChat(input);
        const assistantMessage: AiChatMessage = { role: 'assistant', content: aiResponse };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const barColor = {
        critical: 'bg-red-500',
        warning: 'bg-amber-500',
        success: 'bg-emerald-500',
    };

    const iconColor = {
        critical: 'text-red-500',
        warning: 'text-amber-500',
        success: 'text-emerald-500',
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 bg-violet-50/30 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MaterialIcon name="auto_awesome" size={20} className="text-violet-700" />
                        <h2 className="font-bold text-neutral-900">Oracle</h2>
                    </div>
                    <button aria-label="Close Oracle panel" className="p-1 text-neutral-400 hover:text-violet-700 rounded transition-colors">
                        <MaterialIcon name="close" size={18} />
                    </button>
                </div>
            </div>

            {/* Risk Cards + Suggested Actions (scrollable) */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-neutral-50/30 p-4 space-y-4">
                {/* Risk Cards */}
                {MOCK_RISK_CARDS.map((card, idx) => (
                    <div
                        key={idx}
                        className="p-4 rounded-xl bg-white border border-neutral-200 shadow-sm relative overflow-hidden"
                    >
                        {/* Left color bar */}
                        <div className={cn('absolute top-0 left-0 w-1 h-full', barColor[card.type])} />

                        <div className="pl-2">
                            {/* Label row */}
                            <div className="flex items-center gap-2 mb-1.5">
                                <MaterialIcon name={card.icon} size={16} className={iconColor[card.type]} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                    {card.label}
                                </span>
                            </div>

                            {/* Title */}
                            <h4 className="text-sm font-bold text-neutral-900 mb-1">{card.title}</h4>

                            {/* Description */}
                            <p className="text-xs text-neutral-600 leading-relaxed mb-3">{card.description}</p>

                            {/* Action button */}
                            <button className="py-1.5 px-3 text-xs font-medium text-violet-700 bg-violet-50 rounded hover:bg-violet-100 transition-colors">
                                {card.action}
                            </button>
                        </div>
                    </div>
                ))}

                {/* Suggested Actions */}
                <div className="pt-2">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                        Suggested Actions
                    </p>
                    <div className="space-y-2">
                        {SUGGESTED_ACTIONS.map((action, idx) => (
                            <button
                                key={idx}
                                className="w-full p-3 rounded-lg bg-white border border-neutral-200 hover:border-violet-700 hover:shadow-md transition-all text-left flex items-center justify-between group"
                            >
                                <div>
                                    <p className="text-xs font-bold text-violet-700">{action.title}</p>
                                    <p className="text-[11px] text-neutral-500">{action.subtitle}</p>
                                </div>
                                <MaterialIcon
                                    name="play_arrow"
                                    size={16}
                                    className="text-neutral-300 group-hover:text-violet-700 transition-colors"
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat messages (appear below cards when user interacts) */}
                {messages.map((msg, idx) => (
                    <div key={idx} className={cn('flex gap-3', msg.role === 'user' && 'justify-end')}>
                        {msg.role === 'assistant' && (
                            <div className="size-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <MaterialIcon name="auto_awesome" size={14} className="text-violet-700" />
                            </div>
                        )}
                        <div className={cn('flex flex-col gap-1', msg.role === 'user' && 'items-end')}>
                            <div
                                className={cn(
                                    'px-3 py-2 max-w-[260px] text-xs leading-relaxed',
                                    msg.role === 'assistant'
                                        ? 'bg-white border border-neutral-200 rounded-xl rounded-tl-none shadow-sm'
                                        : 'bg-violet-700 text-white rounded-xl rounded-tr-none shadow-sm'
                                )}
                            >
                                {msg.content}
                            </div>
                        </div>
                        {msg.role === 'user' && (
                            <div className="size-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-indigo-700">
                                U
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="size-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <MaterialIcon name="auto_awesome" size={14} className="text-violet-700" />
                        </div>
                        <div className="px-3 py-2 bg-white border border-neutral-200 rounded-xl rounded-tl-none shadow-sm">
                            <div className="flex gap-1">
                                <div
                                    className="size-1.5 bg-violet-300 rounded-full animate-bounce"
                                    style={{ animationDelay: '0ms' }}
                                />
                                <div
                                    className="size-1.5 bg-violet-300 rounded-full animate-bounce"
                                    style={{ animationDelay: '150ms' }}
                                />
                                <div
                                    className="size-1.5 bg-violet-300 rounded-full animate-bounce"
                                    style={{ animationDelay: '300ms' }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Chat Input */}
            <div className="flex-shrink-0 border-t border-neutral-200 bg-white p-4">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Oracle about this contract..."
                        aria-label="Ask Oracle about this contract"
                        disabled={isLoading}
                        className="w-full pl-4 pr-10 py-3 bg-neutral-50 border-none rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-700 placeholder:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        aria-label="Send message"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-violet-700 rounded-lg text-white hover:bg-violet-800 disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <MaterialIcon name="send" size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
