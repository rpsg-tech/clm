'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Badge, Skeleton, Button, Input } from '@repo/ui';
import { api } from '@/lib/api-client';
import { Search, FileText, Plus, Globe, Sparkles, LayoutTemplate, ArrowRight } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string | null;
    isGlobal: boolean;
    annexures: { id: string; name: string; title: string }[];
}

const categoryColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
    SERVICE_AGREEMENT: 'default',
    NDA: 'info',
    PURCHASE_ORDER: 'warning',
    VENDOR_AGREEMENT: 'success',
    EMPLOYMENT: 'secondary',
    LEASE: 'secondary',
    OTHER: 'secondary',
};

// Simulated Masonry Layout using CSS Columns
export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await api.templates.list();
                setTemplates(data as Template[]);
            } catch (error) {
                console.error('Failed to fetch templates:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    // Extract unique categories
    const categories = ['ALL', ...Array.from(new Set(templates.map(t => t.category)))];

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Template Library</h1>
                    <p className="mt-2 text-neutral-500 max-w-2xl">
                        Start your next contract from a verified template. These standardized agreements ensure compliance and speed up your workflow.
                    </p>
                </div>
                {/* Search Input */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Category Filter Pills */}
            {!isLoading && (
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat
                                    ? 'bg-neutral-900 text-white shadow-md shadow-neutral-900/10 scale-105'
                                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                                }`}
                        >
                            {cat === 'ALL' ? 'All Templates' : cat.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            )}

            {/* Templates Masonry Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                    ))}
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
                    <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
                        <LayoutTemplate className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-lg font-medium text-neutral-900">No templates found</p>
                    <p className="text-neutral-500 mt-1 max-w-xs mx-auto">
                        We couldn't find any templates matching your search criteria.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                        className="mt-6"
                    >
                        Clear Filters
                    </Button>
                </div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {filteredTemplates.map((template) => (
                        <div key={template.id} className="break-inside-avoid">
                            <div
                                className="group relative bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                                onClick={() => router.push(`/dashboard/contracts/new?template=${template.id}`)}
                            >
                                {/* Thumbnail Header */}
                                <div className="h-32 bg-neutral-50 border-b border-neutral-100 relative overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 bg-grid-neutral-200/50 [mask-image:linear-gradient(to_bottom,white,transparent)]" />

                                    {/* Document Icon Placeholder */}
                                    <div className="relative w-16 h-20 bg-white shadow-lg rounded border border-neutral-100 flex flex-col p-2 group-hover:scale-110 transition-transform duration-300">
                                        <div className="h-1.5 w-8 bg-neutral-200 rounded-full mb-1.5" />
                                        <div className="h-1 w-full bg-neutral-100 rounded-full mb-1" />
                                        <div className="h-1 w-full bg-neutral-100 rounded-full mb-1" />
                                        <div className="h-1 w-3/4 bg-neutral-100 rounded-full mb-1" />
                                        <div className="mt-auto flex justify-end">
                                            <div className="h-3 w-3 rounded-full bg-primary-100" />
                                        </div>
                                    </div>

                                    {/* Category Badge - Top Right */}
                                    <div className="absolute top-3 right-3">
                                        <Badge variant={categoryColors[template.category] || 'secondary'} className="bg-white/90 backdrop-blur shadow-sm text-[10px] h-5 px-2 border-neutral-200">
                                            {template.category.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-1 text-lg">
                                            {template.name}
                                        </h3>
                                        {template.isGlobal && (
                                            <div className="text-xs text-neutral-400 flex items-center gap-1" title="Global Template">
                                                <Globe className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-sm text-neutral-500 line-clamp-2 mb-4 h-10">
                                        {template.description || 'Standard agreement template for general business purposes.'}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                                        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                                            <FileText className="w-3 h-3" />
                                            {template.code}
                                        </div>

                                        <div className="flex items-center text-primary-600 text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                            Use Template
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
