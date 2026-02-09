'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTemplates } from '@/lib/hooks/use-templates';
import { TemplateCard } from '@/components/contracts/template-card';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Skeleton } from '@repo/ui';
import type { Template, PaginatedResponse } from '@repo/types';

export default function CreateContractPage() {
    const { currentOrg } = useAuth();
    const [aiPrompt, setAiPrompt] = useState('');
    const search = '';

    const { data, isLoading } = useTemplates({
        search,
    });

    const templates = (data as PaginatedResponse<Template> | undefined)?.data ?? [];

    const handleAiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // AI prompt submission - decorative for now
    };

    return (
        <div className="space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Link href="/dashboard" className="hover:text-primary-700 transition-colors">
                    Dashboard
                </Link>
                <MaterialIcon name="chevron_right" size={16} className="text-neutral-400" />
                <span className="text-neutral-900 font-medium">Create New Agreement</span>
            </div>

            {/* AI Prompt Banner (Hero) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-violet-800 to-indigo-900 p-12">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 size-96 bg-violet-500/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 size-80 bg-indigo-500/20 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 max-w-3xl">
                    {/* Oracle Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/50 border border-violet-400/30 text-white text-xs font-medium mb-6">
                        <MaterialIcon name="auto_awesome" size={14} />
                        ORACLE AI ASSISTANT
                    </div>

                    {/* Main heading */}
                    <h1 className="text-4xl font-bold text-white mb-2">
                        What agreement can I draft for{' '}
                        <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                            {currentOrg?.name || 'your organization'}
                        </span>{' '}
                        today?
                    </h1>

                    {/* Subtitle */}
                    <p className="text-violet-200 mb-6 text-lg">
                        Describe your needs in natural language, and I'll help you find or create the perfect agreement.
                    </p>

                    {/* AI Input */}
                    <form onSubmit={handleAiSubmit} className="relative">
                        <div className="relative">
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder='e.g., "I need a service agreement for a software development project..."'
                                className="w-full px-6 py-4 pr-14 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-violet-200/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                            >
                                <MaterialIcon name="arrow_upward" size={20} className="text-white" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Available Templates Section */}
            <div>
                {/* Section header with Filter/Sort */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900">Available Templates</h2>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-sm font-medium text-neutral-700 transition-colors">
                            <MaterialIcon name="filter_list" size={18} />
                            Filter
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-sm font-medium text-neutral-700 transition-colors">
                            <MaterialIcon name="sort" size={18} />
                            Sort
                        </button>
                    </div>
                </div>

                {/* Template Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-64 rounded-xl" />
                        ))}
                    </div>
                ) : templates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-16 text-center">
                        <MaterialIcon name="folder_copy" size={40} className="text-neutral-300 mx-auto mb-3" />
                        <p className="text-sm text-neutral-500 mb-1">
                            {search ? 'No templates match your search.' : 'No templates available yet.'}
                        </p>
                        <p className="text-xs text-neutral-400">
                            Contact your legal team to create templates.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template: Template) => (
                            <TemplateCard
                                key={template.id}
                                id={template.id}
                                name={template.name}
                                description={template.description}
                                category={template.category}
                                isActive={template.isActive}
                                updatedAt={template.updatedAt as unknown as string | undefined}
                            />
                        ))}
                    </div>
                )}

                {/* Footer link */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-neutral-500">
                        Need to review a counterparty agreement?{' '}
                        <Link href="/dashboard/contracts/upload" className="text-indigo-700 font-medium hover:underline">
                            Upload a document
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
