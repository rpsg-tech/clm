"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Badge } from '@repo/ui';
import { MaterialIcon } from '@/components/ui/material-icon';
import { api } from '@/lib/api-client';

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    code: string;
}

export default function CreateContractPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    async function loadTemplates() {
        try {
            const res = await api.templates.list({ limit: 50 });
            setTemplates(res.data as Template[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    );

    function handleTemplateSelect(template: Template) {
        // Redirect to the new Drafting Workspace
        router.push(`/dashboard/contracts/create/workspace?templateId=${template.id}`);
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Contract</h1>
                <p className="text-slate-500">Select a template to start drafting a new agreement.</p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 mb-8">
                <div className="relative flex-1 max-w-md">
                    <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search templates..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-slate-100 rounded-md animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map(template => (
                        <Card
                            key={template.id}
                            className="p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group relative overflow-hidden"
                            onClick={() => handleTemplateSelect(template)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-primary-50 text-primary-600 rounded-md group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                    <MaterialIcon name="description" className="w-6 h-6" />
                                </div>
                                <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                            </div>
                            <h3 className="font-bold text-lg mb-2 group-hover:text-primary-700 transition-colors">{template.name}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2">{template.description || 'No description provided.'}</p>

                            <div className="mt-4 pt-4 border-t flex justify-end">
                                <span className="text-sm font-medium text-primary-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                    Start Draft <MaterialIcon name="arrow_forward" className="w-4 h-4" />
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
