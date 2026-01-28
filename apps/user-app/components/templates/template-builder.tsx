"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TipTapEditor } from '../editor/tip-tap-editor';
import { Button, Input, Card, Badge, Textarea } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ChevronRight, Upload } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import * as mammoth from 'mammoth';

/* Simple Label Component since it's missing in exports */
const Label = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
        {children}
    </label>
);

interface Annexure {
    id: string; // Temporary ID for frontend
    name: string;
    title: string;
    content: string;
}

interface TemplateBuilderProps {
    mode?: 'create' | 'edit';
    initialData?: any;
}

export function TemplateBuilder({ mode = 'create', initialData }: TemplateBuilderProps) {
    const router = useRouter();
    const { success, error } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // File Import Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importTarget, setImportTarget] = useState<'main' | 'annexure'>('main');

    // Template Metadata
    const [meta, setMeta] = useState({
        name: initialData?.name || '',
        code: initialData?.code || '',
        category: initialData?.category || '',
        description: initialData?.description || '',
        isGlobal: initialData?.isGlobal || false
    });

    const [mainContent, setMainContent] = useState(initialData?.baseContent || '<h1>Main Agreement</h1><p>Start drafting the fixed agreement here...</p>');

    // Annexures
    const [annexures, setAnnexures] = useState<Annexure[]>(
        initialData?.annexures
            ? initialData.annexures.map((a: any) => ({ ...a, id: a.id || Date.now().toString() }))
            : [{ id: '1', name: 'Annexure A', title: 'Scope of Work', content: '<p>Define scope...</p>' }]
    );
    const [activeAnnexureId, setActiveAnnexureId] = useState<string | null>(null);

    // Helpers
    const currentAnnexure = annexures.find(a => a.id === activeAnnexureId);

    // --- File Import Logic ---
    const triggerImport = (target: 'main' | 'annexure') => {
        setImportTarget(target);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset
            fileInputRef.current.click();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isDocx = file.name.endsWith('.docx');
        const isHtml = file.name.endsWith('.html') || file.name.endsWith('.htm');
        const isTxt = file.name.endsWith('.txt');

        if (!isDocx && !isHtml && !isTxt) {
            error('Invalid File', 'Please select a .docx, .html, or .txt file.');
            return;
        }

        const loadingToast = success('Processing', 'Reading file content...');

        try {
            let content = '';

            if (isDocx) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                content = result.value;
                if (result.messages.length > 0) {
                    console.warn('Word Import Warnings:', result.messages);
                }
            } else {
                content = await file.text();
            }

            if (importTarget === 'main') {
                setMainContent(content);
                success('Imported', 'Main agreement content updated.');
            } else if (importTarget === 'annexure' && activeAnnexureId) {
                setAnnexures(prev => prev.map(a => a.id === activeAnnexureId ? { ...a, content } : a));
                success('Imported', 'Annexure content updated.');
            }

        } catch (err) {
            console.error('Import failed', err);
            error('Import Error', 'Failed to read file.');
        }
    };


    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload = {
                ...meta,
                baseContent: mainContent,
                annexures: annexures.map(({ name, title, content }) => ({ name, title, content }))
            };

            if (mode === 'edit' && initialData?.id) {
                await api.templates.update(initialData.id, payload);
                success('Success', 'Template updated successfully');
            } else {
                await api.templates.create(payload);
                success('Success', 'Template created successfully');
            }
            router.push('/dashboard/templates');
        } catch (err) {
            error('Error', `Failed to ${mode} template`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".docx,.html,.txt"
                onChange={handleFileUpload}
            />

            {/* Header / Stepper */}
            <div className="flex items-center justify-between pb-6 border-b mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{mode === 'edit' ? 'Edit Template' : 'Create Template'}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className={step === 1 ? 'font-bold text-primary' : ''}>1. Main Agreement</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className={step === 2 ? 'font-bold text-primary' : ''}>2. Annexures</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className={step === 3 ? 'font-bold text-primary' : ''}>3. Review</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    {step > 1 && <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>}
                    {step < 3 ? (
                        <Button
                            onClick={() => setStep(s => s + 1)}
                            disabled={step === 1 && (!meta.name || !meta.code || !meta.category)}
                        >
                            Next: {step === 1 ? 'Annexures' : 'Review'}
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Template' : 'Create Template')}
                        </Button>
                    )}
                </div>
            </div>

            {/* STEP 1: Metadata & Main Content */}
            {step === 1 && (
                <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
                    <div className="col-span-3 space-y-4 overflow-y-auto pr-2">
                        <Card className="p-4 space-y-4">
                            <h3 className="font-semibold">Template Details</h3>
                            <div className="space-y-2">
                                <Label>Template Name</Label>
                                <Input value={meta.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeta({ ...meta, name: e.target.value })} placeholder="e.g. Master Service Agreement" />
                            </div>
                            <div className="space-y-2">
                                <Label>Unique Code</Label>
                                <Input value={meta.code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeta({ ...meta, code: e.target.value })} placeholder="MSA_V1" />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={meta.category} onValueChange={(v: string) => setMeta({ ...meta, category: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NDA">NDA</SelectItem>
                                        <SelectItem value="SERVICE_AGREEMENT">Service Agreement</SelectItem>
                                        <SelectItem value="EMPLOYMENT">Employment</SelectItem>
                                        <SelectItem value="VENDOR_AGREEMENT">Vendor Agreement</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={meta.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMeta({ ...meta, description: e.target.value })} />
                            </div>
                        </Card>
                    </div>
                    <div className="col-span-9 h-full flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-2">
                            <Label>Main Agreement Content (Fixed)</Label>
                            <Button size="sm" variant="outline" onClick={() => triggerImport('main')} className="h-7 text-xs gap-1">
                                <Upload className="w-3 h-3" /> Import File
                            </Button>
                        </div>
                        <TipTapEditor content={mainContent} onChange={setMainContent} className="flex-1 h-full" />
                    </div>
                </div>
            )}

            {/* STEP 2: Annexures */}
            {step === 2 && (
                <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
                    <div className="col-span-3 flex flex-col gap-4">
                        <Card className="flex-1 flex flex-col p-4 overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">Annexures</h3>
                                <Button size="sm" variant="outline" onClick={() => {
                                    const newId = Date.now().toString();
                                    setAnnexures([...annexures, { id: newId, name: 'New Annexure', title: '', content: '' }]);
                                    setActiveAnnexureId(newId);
                                }}>
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {annexures.map((annexure, idx) => (
                                    <div
                                        key={annexure.id}
                                        className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors ${activeAnnexureId === annexure.id ? 'border-primary ring-1 ring-primary bg-slate-50' : 'border-slate-200'}`}
                                        onClick={() => setActiveAnnexureId(annexure.id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-sm flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1">{idx + 1}</Badge>
                                                    {annexure.name || 'Untitled'}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">
                                                    {annexure.title || 'No Title'}
                                                </div>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                setAnnexures(annexures.filter(a => a.id !== annexure.id));
                                                if (activeAnnexureId === annexure.id) setActiveAnnexureId(null);
                                            }}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                    <div className="col-span-9 h-full flex flex-col min-h-0">
                        {currentAnnexure ? (
                            <div className="flex flex-col h-full gap-4">
                                <div className="flex items-end justify-end mb-1">
                                    <Button size="sm" variant="outline" onClick={() => triggerImport('annexure')} className="h-7 text-xs gap-1">
                                        <Upload className="w-3 h-3" /> Import File
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Annexure Name (Key)</Label>
                                        <Input
                                            value={currentAnnexure.name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnnexures(annexures.map(a => a.id === currentAnnexure.id ? { ...a, name: e.target.value } : a))}
                                            placeholder="e.g. Annexure A"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Title (Display)</Label>
                                        <Input
                                            value={currentAnnexure.title}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnnexures(annexures.map(a => a.id === currentAnnexure.id ? { ...a, title: e.target.value } : a))}
                                            placeholder="e.g. Scope of Services"
                                        />
                                    </div>
                                </div>
                                <TipTapEditor
                                    key={currentAnnexure.id} // Force re-mount on switch to update content
                                    content={currentAnnexure.content}
                                    onChange={(html) => setAnnexures(annexures.map(a => a.id === currentAnnexure.id ? { ...a, content: html } : a))}
                                    className="flex-1 h-full"
                                />
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed rounded-xl">
                                Select an annexure to edit or create a new one
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
                <div className="flex-1 overflow-y-auto bg-slate-100 p-8 rounded-lg border">
                    <div className="max-w-4xl mx-auto bg-white shadow-lg p-12 min-h-[1000px]">
                        <div className="mb-8 border-b pb-4">
                            <h2 className="text-3xl font-bold text-slate-900">{meta.name}</h2>
                            <p className="text-slate-500">{meta.description}</p>
                        </div>

                        <div className="prose max-w-none mb-12" dangerouslySetInnerHTML={{ __html: mainContent }} />

                        {annexures.map((annexure, i) => (
                            <div key={annexure.id} className="mt-8 border-t-2 border-slate-900 pt-8 break-before-page">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold uppercase tracking-wider text-slate-700">{annexure.name}</h3>
                                    <h2 className="text-2xl font-bold text-slate-900 mt-1">{annexure.title}</h2>
                                </div>
                                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: annexure.content }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
