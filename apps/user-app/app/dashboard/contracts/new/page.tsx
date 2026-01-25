"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Wand2, Calendar, FileText, User } from "lucide-react";
import { WizardStepper } from "@/components/wizard-stepper";
import { AIAssistantView } from "@/components/ai-assistant-view";
import { TemplateSelectionView } from "@/components/template-selection-view";
import { AnnexuresView, AnnexureItem } from "@/components/annexures-view";
import { ContractEditorView } from "@/components/contract-editor-view";
import { ContractAssistantSidebar } from "@/components/contract-assistant-sidebar";
import { FinalReviewView } from "@/components/final-review-view";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { Template } from "@repo/types";
import { Button, Card, Badge, Spinner } from '@repo/ui';

// --- Contract Details Form Component (Step 3) ---
interface ContractDetailsFormProps {
    data: any;
    onChange: (data: any) => void;
    templateName?: string;
}

function ContractDetailsForm({ data, onChange, templateName }: ContractDetailsFormProps) {
    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: string, value: any) => {
        // Clear error on change
        setError(null);

        // Date Validation Logic
        if (field === "endDate" && data.startDate && value) {
            if (new Date(value) < new Date(data.startDate)) {
                setError("End Date cannot be earlier than Start Date");
            }
        }
        if (field === "startDate" && data.endDate && value) {
            if (new Date(data.endDate) < new Date(value)) {
                setError("End Date cannot be earlier than Start Date");
            }
        }

        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto">
            <div className="text-center space-y-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3 border border-orange-100">
                    <Wand2 className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Contract Details</h2>
                <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">Specifics for <span className="text-slate-900 font-bold">{templateName || "Contract"}</span>.</p>
            </div>

            <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl p-8 space-y-8">
                {/* Basic Info Group */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <h3 className="text-sm font-bold text-slate-900">General Information</h3>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Contract Title</label>
                        <input
                            type="text"
                            value={data.title || ""}
                            onChange={(e) => handleChange("title", e.target.value)}
                            placeholder="e.g. Master Service Agreement - Q4 2024"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder-slate-400 font-bold text-base"
                        />
                    </div>
                </div>

                {/* Counterparty Group */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                        <User className="w-4 h-4 text-orange-600" />
                        <h3 className="text-sm font-bold text-slate-900">Counterparty</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Entity Name</label>
                            <input
                                type="text"
                                value={data.counterpartyName || ""}
                                onChange={(e) => handleChange("counterpartyName", e.target.value)}
                                placeholder="Client or Vendor Name"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder-slate-400 font-medium text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                            <input
                                type="email"
                                value={data.counterpartyEmail || ""}
                                onChange={(e) => handleChange("counterpartyEmail", e.target.value)}
                                placeholder="contact@example.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder-slate-400 font-medium text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Commercial Terms Group */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <h3 className="text-sm font-bold text-slate-900">Terms & Value</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Start Date</label>
                            <input
                                type="date"
                                value={data.startDate || ""}
                                onChange={(e) => handleChange("startDate", e.target.value)}
                                className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium text-sm ${error ? "border-rose-200 bg-rose-50" : "border-slate-200"}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">End Date</label>
                            <input
                                type="date"
                                value={data.endDate || ""}
                                onChange={(e) => handleChange("endDate", e.target.value)}
                                className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium text-sm ${error ? "border-rose-200 bg-rose-50" : "border-slate-200"}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Contract Value</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                <input
                                    type="number"
                                    value={data.amount || ""}
                                    onChange={(e) => handleChange("amount", e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-8 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder-slate-400 font-mono font-medium text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 border border-rose-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Scope / Brief</label>
                        <textarea
                            value={data.description || ""}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Briefly describe the purpose of this agreement..."
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder-slate-400 font-medium text-sm resize-none"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}

// --- Main Page Component ---
const STEPS = ["Assistant", "Template", "Details", "Editor", "Annexures", "Review"];

// Mock Data for "Standard Annexures"
const STANDARD_ANNEXURES: AnnexureItem[] = [
    { id: "annex-a", title: "Annexure A", subtitle: "Scope of Services", content: "The Service Provider agrees to perform the following services...\n\n1. Initial Consultation\n2. Implementation Strategy\n3. Ongoing Maintenance" },
    { id: "annex-b", title: "Annexure B", subtitle: "Payment Schedule", content: "Payment shall be made according to the following schedule:\n\n- 50% upon signing\n- 25% upon completion of Phase 1\n- 25% upon final delivery" },
    { id: "annex-c", title: "Annexure C", subtitle: "SLA Terms", content: "Service Level Agreement Terms...\n\nResponse time: 4 hours\nResolution time: 24 hours" },
];

export default function NewContractPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Data State
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

    // Wizard State
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [contractDetails, setContractDetails] = useState<any>({});
    const [editorContent, setEditorContent] = useState(""); // Lifted state for contract body
    const [annexures, setAnnexures] = useState<AnnexureItem[]>(STANDARD_ANNEXURES);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await api.templates.list() as unknown as Template[];
                if (Array.isArray(data)) {
                    setTemplates(data);
                } else {
                    // @ts-ignore
                    setTemplates(data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch templates:", error);
            } finally {
                setIsLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, []);

    // Handle URL Template Selection
    useEffect(() => {
        const templateIdParam = searchParams.get('template');
        if (templateIdParam && templates.length > 0 && !selectedTemplate) {
            const t = templates.find(temp => temp.id === templateIdParam);
            if (t) {
                setSelectedTemplate(t);
                setCurrentStep(2); // Jump to Details directly
            }
        }
    }, [templates, searchParams, selectedTemplate]);

    // Initialize editor content when template is selected
    useEffect(() => {
        if (selectedTemplate && !editorContent) {
            setEditorContent(selectedTemplate.baseContent || "");
        }
    }, [selectedTemplate]);

    // Helpers
    const goNext = () => setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1));
    const goBack = () => setCurrentStep((p) => Math.max(p - 1, 0));

    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template);
        if (currentStep === 0) {
            setCurrentStep(2); // Jump to Details
        } else {
            goNext();
        }
    };

    const handleAnnexureChange = (id: string, newContent: string) => {
        setAnnexures(prev => prev.map(a => a.id === id ? { ...a, content: newContent } : a));
    };

    // Compile the final document content
    const getFinalDocumentContent = () => {
        let finalHtml = editorContent;

        // Append Annexures
        if (annexures.length > 0) {
            finalHtml += "<br/><br/><hr/><br/>";
            finalHtml += "<h2 style='text-align:center'>ANNEXURES</h2><br />";
            annexures.forEach(annexure => {
                finalHtml += `<br/><h3>${annexure.title}: ${annexure.subtitle}</h3>`;
                finalHtml += `<div>${annexure.content.replace(/\n/g, "<br/>")}</div>`;
            });
        }

        return finalHtml;
    }

    const handleContractSubmit = async () => {
        if (!selectedTemplate) return;

        setLoading(true);
        try {
            const finalContent = getFinalDocumentContent();

            const payload = {
                title: contractDetails.title || `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
                templateId: selectedTemplate.id,
                counterpartyName: contractDetails.counterpartyName,
                counterpartyEmail: contractDetails.counterpartyEmail,
                startDate: contractDetails.startDate ? new Date(contractDetails.startDate).toISOString() : undefined,
                endDate: contractDetails.endDate ? new Date(contractDetails.endDate).toISOString() : undefined,
                amount: contractDetails.amount ? parseFloat(contractDetails.amount) : undefined,
                description: contractDetails.description || "",
                fieldData: {
                    title: contractDetails.title,
                    ...contractDetails
                },
                annexureData: finalContent,
            };

            const newContract = await api.contracts.create(payload as any);

            // @ts-ignore
            router.push(`/dashboard/contracts/${newContract.id || newContract.reference}`);

        } catch (error: any) {
            console.error("Failed to create contract:", error);
            const message = error.response?.data?.message || error.message || "Unknown error";
            alert(`Failed to create contract: ${Array.isArray(message) ? message.join(', ') : message}`);
        } finally {
            setLoading(false);
        }
    };

    // Render Logic
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: return <AIAssistantView onTemplateSelect={handleTemplateSelect} templates={templates} />;
            case 1: return <TemplateSelectionView onSelect={handleTemplateSelect} selectedTemplateId={selectedTemplate?.id} templates={templates} />;
            case 2: return <ContractDetailsForm data={contractDetails} onChange={setContractDetails} templateName={selectedTemplate?.name} />;

            case 3: // Editor
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 h-[700px] animate-in fade-in zoom-in-95 duration-500">
                        <ContractEditorView
                            content={editorContent}
                            onChange={setEditorContent}
                            onContinue={goNext}
                        />
                        <ContractAssistantSidebar />
                    </div>
                );

            case 4: // Annexures
                return (
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                        <AnnexuresView
                            annexures={annexures}
                            onAnnexureChange={handleAnnexureChange}
                            onUpdate={setAttachedFiles}
                        />
                        <div className="p-6 flex justify-end border-t border-slate-50 mt-8">
                            <Button onClick={goNext} className="bg-orange-600 hover:bg-slate-900 text-white font-bold uppercase text-xs tracking-wide h-10 px-8 rounded-xl transition-all shadow-lg shadow-orange-600/20 hover:shadow-xl flex items-center gap-2">
                                Review & Sign <ArrowRight size={14} />
                            </Button>
                        </div>
                    </div>
                );

            case 5: // Final Review
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 h-[700px] animate-in fade-in zoom-in-95 duration-500">
                        <FinalReviewView
                            content={getFinalDocumentContent()}
                            details={contractDetails}
                            templateName={selectedTemplate?.name}
                            onSubmit={handleContractSubmit}
                            loading={loading}
                        />
                        <ContractAssistantSidebar />
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto py-8 px-6 pb-20 selection:bg-orange-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create New Contract</h1>
                    <p className="text-slate-500 font-medium text-sm">Follow the guided workflow to generate your commercial agreement.</p>
                </div>

                {currentStep > 0 && (
                    <Button
                        onClick={goBack}
                        variant="ghost"
                        className="flex items-center gap-2 h-9 px-4 text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                    >
                        <ArrowLeft size={14} />
                        Back
                    </Button>
                )}
            </div>

            <div className="mb-10">
                <WizardStepper currentStep={currentStep} steps={STEPS} />
            </div>

            {/* Main Content Area - Layout Changes based on step */}
            <div className="min-h-[500px]">
                {isLoadingTemplates ? (
                    <div className="flex h-[400px] items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Spinner size="lg" color="orange" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Resources...</p>
                        </div>
                    </div>
                ) : (
                    renderStepContent()
                )}
            </div>

            {/* Navigation Footer (Only for Steps 0, 1, 2) 
                Steps 3, 4, 5 have their own embedded navigation actions
            */}
            {(currentStep < 3) && (
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 max-w-4xl mx-auto">
                    {/* Placeholder for alignment */}
                    <div />

                    <div className="flex gap-4">
                        {currentStep === 0 && (
                            <Button
                                onClick={goNext}
                                variant="ghost"
                                className="flex items-center px-6 h-10 rounded-xl font-bold uppercase text-[10px] tracking-wide text-orange-600 hover:bg-orange-50 transition-all ml-auto"
                            >
                                Skip AI Assistant <ArrowRight size={14} className="ml-2" />
                            </Button>
                        )}

                        {currentStep > 0 && (
                            <Button
                                onClick={goNext}
                                disabled={currentStep === 2 && !contractDetails.title}
                                className="flex items-center px-8 h-11 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-wide hover:bg-orange-600 shadow-lg hover:shadow-orange-600/20 transition-all disabled:opacity-50 disabled:hover:bg-slate-900 disabled:shadow-none"
                            >
                                Continue <ArrowRight size={14} className="ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
