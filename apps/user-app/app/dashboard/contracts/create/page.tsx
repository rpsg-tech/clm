"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Badge } from '@repo/ui';
import { Search, FileText, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Simple Label component
const Label = ({ children, htmlFor, className = "" }: { children: React.ReactNode, htmlFor?: string, className?: string }) => (
    <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
        {children}
    </label>
);

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    code: string;
}

export default function CreateContractPage() {
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [createLoading, setCreateLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        counterpartyName: '',
        description: ''
    });

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

    async function handleCreate() {
        if (!selectedTemplate) return;
        try {
            setCreateLoading(true);
            const res = await api.contracts.create({
                templateId: selectedTemplate.id,
                title: formData.title,
                counterpartyName: formData.counterpartyName,
                description: formData.description,
                annexureData: '', // Backend will populate from template
                fieldData: {} // Empty initial field data
            });

            // Redirect to the editor (Split View)
            router.push(`/dashboard/contracts/${(res as any).id}/edit`);
        } catch (error) {
            console.error('Failed to create contract', error);
        } finally {
            setCreateLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Contract</h1>
                <p className="text-slate-500">Select a template to start drafting a new agreement.</p>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search templates..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map(template => (
                        <Card
                            key={template.id}
                            className="p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group relative overflow-hidden"
                            onClick={() => {
                                setSelectedTemplate(template);
                                setFormData({ ...formData, title: `${template.name} - ${new Date().toLocaleDateString()}` });
                            }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                            </div>
                            <h3 className="font-bold text-lg mb-2 group-hover:text-blue-700 transition-colors">{template.name}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2">{template.description || 'No description provided.'}</p>

                            <div className="mt-4 pt-4 border-t flex justify-end">
                                <span className="text-sm font-medium text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                    Use Template <Plus className="w-4 h-4" />
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start Draft: {selectedTemplate?.name}</DialogTitle>
                        <DialogDescription>
                            Enter the basic details to initialize this contract.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Contract Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cp">Counterparty Name</Label>
                            <Input
                                id="cp"
                                value={formData.counterpartyName}
                                onChange={(e) => setFormData({ ...formData, counterpartyName: e.target.value })}
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={createLoading}>
                            {createLoading ? 'Creating...' : 'Create Contract'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
