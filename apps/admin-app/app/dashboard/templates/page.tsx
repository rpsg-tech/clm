'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api-client';
import { Card, Button, Badge, Spinner } from '@repo/ui';
import {
    LayoutTemplate,
    Plus,
    Search,
    ScrollText,
    Loader2,
    Edit3,
    Trash2,
    Eye,
    Code
} from 'lucide-react';

interface Template {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string | null;
    isGlobal: boolean;
    isActive: boolean;
    createdAt: string;
    baseContent?: string;
}

export default function TemplatesAdminPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await api.templates.list();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = async (template: Template) => {
        try {
            setSubmitLoading(true);
            const fullTemplate = await api.templates.get(template.id);
            setSelectedTemplate(fullTemplate);
            setName(fullTemplate.name);
            setDescription(fullTemplate.description || '');
            setIsActive(fullTemplate.isActive);
            setShowEditModal(true);
        } catch (error) {
            console.error('Failed to fetch template details', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleViewClick = async (template: Template) => {
        try {
            setSubmitLoading(true);
            const fullTemplate = await api.templates.get(template.id);
            setSelectedTemplate(fullTemplate);
            setShowViewModal(true);
        } catch (error) {
            console.error('Failed to fetch template details', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;
        try {
            setSubmitLoading(true);
            await api.templates.update(selectedTemplate.id, {
                name,
                description,
                isActive
            });
            setShowEditModal(false);
            resetForm();
            await loadTemplates();
        } catch (error) {
            console.error('Failed to update template', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this template? Users will no longer be able to create contracts from it.')) return;
        try {
            setSubmitLoading(true);
            await api.templates.update(id, { isActive: false });
            await loadTemplates();
        } catch (error) {
            console.error('Failed to deactivate template', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setSelectedTemplate(null);
    };

    return (
        <div className="space-y-8 pb-20 selection:bg-orange-100 relative">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Templates</h1>
                    <p className="text-slate-500 font-medium text-sm">Manage standard <span className="text-slate-900">contract templates</span> and structures.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden lg:block group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search library..."
                            className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 w-64 shadow-sm transition-all placeholder-slate-400"
                        />
                    </div>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 h-10 shadow-lg shadow-orange-600/20 border-none transition-all font-bold tracking-tight text-xs flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Template
                    </Button>
                </div>
            </div>

            <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[35%]">Template Name</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[15%]">Category</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[15%]">Visibility</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[15%]">Status</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-right w-[20%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-8 h-8 bg-slate-50 rounded-lg" />
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-4 bg-slate-50 rounded-full w-1/4" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : templates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center max-w-xs mx-auto space-y-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                                <LayoutTemplate className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-slate-900">Library Empty</h3>
                                                <p className="text-slate-400 font-medium text-xs">No templates found in the global library.</p>
                                            </div>
                                            <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-10 font-bold tracking-wide text-xs shadow-lg shadow-orange-600/20 transition-all">
                                                Create First Template
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : templates.map((template) => (
                                <tr key={template.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center transition-all duration-300 group-hover:bg-orange-600 group-hover:border-orange-500 group-hover:text-white shadow-sm">
                                                <LayoutTemplate className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm mb-0.5 group-hover:text-orange-600 transition-colors">{template.name}</div>
                                                <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 line-clamp-1 max-w-[200px]">
                                                    {template.description || 'No description provided'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-orange-50 rounded-md border border-orange-100">
                                                <ScrollText className="w-3 h-3 text-orange-500" />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                                                {template.category}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {template.isGlobal ? (
                                            <Badge className="bg-orange-50 text-orange-700 border border-orange-100 font-bold uppercase tracking-wider text-[9px] px-2.5 py-0.5 rounded-lg">
                                                Global
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[9px] px-2.5 py-0.5 rounded-lg">
                                                Organization
                                            </Badge>
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
                                        <div className="flex items-center justify-end gap-1 opacity-100 transition-all duration-200">
                                            <Button
                                                onClick={() => handleViewClick(template)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                onClick={() => handleEditClick(template)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(template.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Edit Modal */}
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
                                <Button type="button" variant="ghost" onClick={() => { setShowEditModal(false); resetForm(); }} className="text-slate-500 hover:text-slate-900 font-bold text-xs">Cancel</Button>
                                <Button type="submit" disabled={submitLoading || !name} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 h-10 shadow-lg text-xs font-bold tracking-wide">
                                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && selectedTemplate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <Card className="w-full max-w-4xl bg-white border-transparent shadow-2xl rounded-2xl overflow-hidden p-0 max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Template Content</h3>
                                <p className="text-slate-500 text-sm">Previewing {selectedTemplate.name}.</p>
                            </div>
                            <Badge className="bg-orange-600 text-white font-bold uppercase text-[10px] tracking-wider px-3 py-1 rounded-full border-none">Read Only</Badge>
                        </div>
                        <div className="p-0 flex-1 overflow-hidden relative">
                            <div className="absolute inset-0 overflow-y-auto">
                                <div className="min-h-full bg-slate-900 p-8 text-sm font-mono text-slate-300">
                                    <pre className="whitespace-pre-wrap">{selectedTemplate.baseContent || "// No content available for this template."}</pre>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex justify-end">
                            <Button onClick={() => { setShowViewModal(false); setSelectedTemplate(null); }} className="bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl px-6 h-10 font-bold text-xs">
                                Close Preview
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
