'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Badge, Skeleton, Button, Input } from '@repo/ui';
import { Pagination } from '@/components/ui/pagination';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
    Search,
    FileText,
    Plus,
    Globe,
    Sparkles,
    LayoutTemplate,
    ArrowRight,
    Edit3,
    Trash2,
    Eye,
    ScrollText,
    Loader2
} from 'lucide-react';

interface Template {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string | null;
    isGlobal: boolean;
    isActive: boolean;
    baseContent?: string;
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

export default function TemplatesPage() {
    const router = useRouter();
    const { hasPermission } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

    // Admin State
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    const canManageTemplates = hasPermission('template:create');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchTemplates();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory]);

    useEffect(() => {
        fetchTemplates();
    }, [page]);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            const response = await api.templates.list({
                category: selectedCategory,
                page,
                limit: viewMode === 'GRID' ? 9 : 10, // Adjust limit based on view? 
                search: searchQuery
            });
            setTemplates(response.data as Template[]);
            setMeta(response.meta);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Categories list - Hardcoded or fetched separately? 
    // Ideally should be fetched from backend or just static list if we don't want to fetch all templates just to get categories
    const categories = ['ALL', 'SERVICE_AGREEMENT', 'NDA', 'PURCHASE_ORDER', 'VENDOR_AGREEMENT', 'EMPLOYMENT', 'LEASE', 'OTHER'];

    const filteredTemplates = templates; // Server side filtered

    const handleEditClick = (template: Template) => {
        setSelectedTemplate(template);
        setName(template.name);
        setDescription(template.description || '');
        setIsActive(template.isActive);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;
        try {
            setSubmitLoading(true);
            // Use Admin API for updates if available, or standard update
            await api.templates.update(selectedTemplate.id, {
                name,
                description,
                isActive
            });
            setShowEditModal(false);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to update template', error);
        } finally {
            setSubmitLoading(false);
        }
    };

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
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* View Toggle for Admins */}
                    {canManageTemplates && (
                        <div className="bg-neutral-100 p-1 rounded-lg flex items-center">
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'GRID' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('TABLE')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'TABLE' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                            >
                                Table
                            </button>
                        </div>
                    )}

                    {/* Search Input */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all shadow-sm"
                        />
                    </div>

                    {canManageTemplates && (
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 h-10 shadow-lg shadow-orange-600/20 border-none transition-all font-bold tracking-tight text-xs flex items-center gap-2 shrink-0">
                            <Plus className="w-4 h-4" />
                            New Template
                        </Button>
                    )}
                </div>
            </div>

            {/* Category Filter Pills */}
            {!isLoading && (
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${selectedCategory === cat
                                ? 'bg-neutral-900 text-white shadow-md shadow-neutral-900/10 scale-105'
                                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                                }`}
                        >
                            {cat === 'ALL' ? 'All Templates' : cat.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            )}

            {/* Templates Content */}
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
            ) : viewMode === 'TABLE' ? (
                // TABLE VIEW (Admin Focused)
                <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[35%]">Template Name</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[15%]">Category</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[15%]">Visibility</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[15%]">Status</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-xs text-right w-[20%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredTemplates.map((template) => (
                                    <tr key={template.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center transition-all group-hover:bg-orange-600 group-hover:border-orange-500 group-hover:text-white">
                                                    <LayoutTemplate className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm mb-0.5">{template.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium line-clamp-1 max-w-[200px]">
                                                        {template.description || 'No description provided'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={categoryColors[template.category] || 'secondary'} className="bg-white text-slate-600 border border-slate-200">
                                                {template.category.replace(/_/g, ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            {template.isGlobal ? (
                                                <Badge className="bg-orange-50 text-orange-700 border border-orange-100">Global</Badge>
                                            ) : (
                                                <Badge className="bg-slate-900 text-white border-slate-900">Org Only</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {template.isActive ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[11px] font-bold text-emerald-600">Active</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 opacity-50">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                    <span className="text-[11px] font-bold text-slate-500">Inactive</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    onClick={() => handleEditClick(template)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                // GRID VIEW (User Focused)
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
                                    <div className="relative w-16 h-20 bg-white shadow-lg rounded border border-neutral-100 flex flex-col p-2 group-hover:scale-110 transition-transform duration-300">
                                        <div className="h-1.5 w-8 bg-neutral-200 rounded-full mb-1.5" />
                                        <div className="h-1 w-full bg-neutral-100 rounded-full mb-1" />
                                        <div className="h-1 w-full bg-neutral-100 rounded-full mb-1" />
                                        <div className="h-1 w-3/4 bg-neutral-100 rounded-full mb-1" />
                                        <div className="mt-auto flex justify-end">
                                            <div className="h-3 w-3 rounded-full bg-primary-100" />
                                        </div>
                                    </div>
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

            {/* Edit Modal (Admin Only) */}
            {meta && (
                <div className="mt-8">
                    <Pagination
                        meta={meta}
                        onPageChange={setPage}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {/* Edit Modal (Admin Only) */}
            {showEditModal && selectedTemplate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <Card className="w-full max-w-lg bg-white border-transparent shadow-2xl rounded-2xl overflow-hidden p-0">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Edit Template</h3>
                            <p className="text-slate-500 text-sm">Update configuration for {selectedTemplate.name}.</p>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Name</label>
                                    <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-sm h-32 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Status</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Deactivate to prevent usage.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsActive(!isActive)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-300 ${isActive ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => { setShowEditModal(false); }} className="text-slate-500 hover:text-slate-900 font-bold text-xs">Cancel</Button>
                                <Button type="submit" disabled={submitLoading || !name} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 h-10 shadow-lg text-xs font-bold tracking-wide">
                                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
