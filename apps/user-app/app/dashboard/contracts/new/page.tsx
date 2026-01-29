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
import { useToast } from "@/lib/toast-context";

// --- Contract Details Form Component (Step 3) ---
interface ContractDetailsFormProps {
    data: any;
    onChange: (data: any) => void;
    templateName?: string;
    onError: (hasError: boolean) => void;
}

function ContractDetailsForm({ data, onChange, templateName, onError }: ContractDetailsFormProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: any) => {
        const newErrors = { ...errors };
        delete newErrors[field]; // Clear error for this field

        // Validation Logic
        if (field === "startDate" && value) {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                newErrors.startDate = "Start date must be today or in the future";
            } else if (data.endDate && new Date(data.endDate) < selectedDate) {
                newErrors.endDate = "End Date cannot be earlier than Start Date";
            } else {
                // If start date becomes valid, re-check end date if it was previously invalid due to start date
                if (data.endDate && new Date(data.endDate) >= selectedDate) {
                    delete newErrors.endDate;
                }
            }
        }

        if (field === "endDate" && data.startDate && value) {
            if (new Date(value) < new Date(data.startDate)) {
                newErrors.endDate = "End Date cannot be earlier than Start Date";
            }
        }

        if (field === "counterpartyEmail") {
            if (value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    newErrors.counterpartyEmail = "Please enter a valid email address";
                }
            }
        }

        if (field === "title") {
            if (!value || value.trim() === "") {
                newErrors.title = "Contract Title is required";
            }
        }

        if (field === "counterpartyName") {
            if (!value || value.trim() === "") {
                newErrors.counterpartyName = "Entity Name is required";
            }
        }

        setErrors(newErrors);

        // Re-validate strictly for navigation blocking
        const potentialData = { ...data, [field]: value };
        let isInvalid = false;

        // Check for any active visual errors first
        if (Object.keys(newErrors).length > 0) {
            isInvalid = true;
        }

        // Also run the strict checks again to ensure we catch empty required fields (though visual errors should catch them if touched)
        // Ideally, we depend on visual errors + checking required fields presence
        if (!potentialData.title || potentialData.title.trim() === "") isInvalid = true;
        if (!potentialData.counterpartyName || potentialData.counterpartyName.trim() === "") isInvalid = true;

        if (potentialData.startDate) {
            const sd = new Date(potentialData.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (sd < today) isInvalid = true;

            if (potentialData.endDate) {
                const ed = new Date(potentialData.endDate);
                if (ed < sd) isInvalid = true;
            }
        }

        if (potentialData.counterpartyEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(potentialData.counterpartyEmail)) isInvalid = true;
        }

        onError(isInvalid);

        onChange(potentialData);
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
                            className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder-slate-400 font-bold text-base ${errors.title ? "border-rose-200 bg-rose-50" : "border-slate-200"}`}
                        />
                        {errors.title && <p className="text-rose-600 text-[10px] font-bold mt-1">{errors.title}</p>}
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
                                className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder-slate-400 font-medium text-sm ${errors.counterpartyName ? "border-rose-200 bg-rose-50" : "border-slate-200"}`}
                            />
                            {errors.counterpartyName && <p className="text-rose-600 text-[10px] font-bold mt-1">{errors.counterpartyName}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                            <input
                                type="email"
                                value={data.counterpartyEmail || ""}
                                onChange={(e) => handleChange("counterpartyEmail", e.target.value)}
                                placeholder="contact@example.com"
                                className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder-slate-400 font-medium text-sm ${errors.counterpartyEmail ? "border-rose-200 bg-rose-50" : "border-slate-200"}`}
                            />
                            {errors.counterpartyEmail && <p className="text-rose-600 text-[10px] font-bold mt-1">{errors.counterpartyEmail}</p>}
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
                                className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium text-sm ${errors.startDate ? "border-rose-200 bg-rose-50" : "border-slate-200"}`}
                            />
                            {errors.startDate && <p className="text-rose-600 text-[10px] font-bold mt-1">{errors.startDate}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">End Date</label>
                            <input
                                type="date"
                                value={data.endDate || ""}
                                onChange={(e) => handleChange("endDate", e.target.value)}
                                className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium text-sm ${errors.endDate ? "border-rose-200 bg-rose-50" : "border-slate-200"}`}
                            />
                            {errors.endDate && <p className="text-rose-600 text-[10px] font-bold mt-1">{errors.endDate}</p>}
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

// Initial single annexure
const INITIAL_ANNEXURES: AnnexureItem[] = [
    { id: "annex-a", title: "Price", content: "The Service Provider agrees to perform the following services...\n\n1. Initial Consultation\n2. Implementation Strategy\n3. Ongoing Maintenance" }
];

export default function NewContractPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { success: showSuccess, error: showError } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [stepError, setStepError] = useState(false);
    const [showAiPanel, setShowAiPanel] = useState(false);

    // Data State
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

    // Wizard State
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [contractDetails, setContractDetails] = useState<any>({});
    const [editorContent, setEditorContent] = useState("");

    // Dynamic Annexures State - Start with 1
    const [annexures, setAnnexures] = useState<AnnexureItem[]>(INITIAL_ANNEXURES);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await api.templates.list();
                // @ts-ignore
                if (response.data) {
                    // @ts-ignore
                    setTemplates(response.data as Template[]);
                } else {
                    setTemplates([]);
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

    // Initialize editor content and annexures when template is selected
    // Initialize editor content and annexures when template is selected
    useEffect(() => {
        const loadFullTemplate = async () => {
            if (selectedTemplate) {
                try {
                    // Fetch full template details to get annexure content (list view is optimized/slim)
                    const fullTemplate = await api.templates.get(selectedTemplate.id) as any;
                    setEditorContent(fullTemplate.baseContent || "");

                    // Auto-populate annexures from template
                    if ((fullTemplate as any).annexures?.length > 0) {
                        setAnnexures((fullTemplate as any).annexures.map((a: any) => ({
                            id: a.id || `annex-${Math.random().toString(36).substr(2, 9)}`,
                            title: a.title || a.name, // Handle legacy 'name' vs new 'title'
                            content: a.content || ""
                        })));
                    } else {
                        setAnnexures(INITIAL_ANNEXURES);
                    }
                } catch (error) {
                    console.error("Failed to load full template details:", error);
                    showError("Template Error", "Failed to load template details.");
                    // Fallback to what we have or initial
                    setEditorContent(selectedTemplate.baseContent || "");
                    setAnnexures(INITIAL_ANNEXURES);
                }
            }
        };

        loadFullTemplate();
    }, [selectedTemplate]);

    // Helpers
    const goNext = () => setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1));
    const goBack = () => setCurrentStep((p) => Math.max(p - 1, 0));

    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template);
        if (currentStep === 0) {
            setCurrentStep(2);
        } else {
            goNext();
        }
    };

    // --- Dynamic Annexure Handlers ---

    const handleAnnexureChange = (id: string, newContent: string) => {
        setAnnexures(prev => prev.map(a => a.id === id ? { ...a, content: newContent } : a));
    };

    const handleTitleChange = (id: string, newTitle: string) => {
        setAnnexures(prev => prev.map(a => a.id === id ? { ...a, title: newTitle } : a));
    };

    const handleAddAnnexure = () => {
        setAnnexures(prev => {
            const nextIndex = prev.length;
            const nextLetter = String.fromCharCode(65 + nextIndex); // A, B, C...
            return [
                ...prev,
                {
                    id: `annex-${Date.now()}`,
                    title: `Annexure ${nextLetter}`,
                    content: "Enter content here..."
                }
            ];
        });
    };

    const handleRemoveAnnexure = (id: string) => {
        if (annexures.length <= 1) return; // Prevent deleting the last one
        setAnnexures(prev => prev.filter(a => a.id !== id));
    };

    // Helper for saving: only the annexures
    const getOnlyAnnexuresHtml = () => {
        if (annexures.length === 0) return "";
        let finalHtml = "";
        annexures.forEach((annexure, index) => {
            finalHtml += `<div class="annexure-section">`;
            finalHtml += `<h3>${annexure.title}</h3>`;
            finalHtml += `<div>${annexure.content.replace(/\n/g, "<br/>")}</div>`;
            finalHtml += `</div>`;
        });
        return finalHtml;
    };

    // Compile the final document content for PREVIEW
    const getFinalDocumentContent = () => {
        let finalHtml = editorContent;

        // Append Annexures
        if (annexures.length > 0) {
            // Force start on new page for the Annexures section
            finalHtml += '<div style="page-break-before: always; break-before: page; height: 1px; display: block;"></div>';

            finalHtml += "<h2 style='text-align:center; text-transform: uppercase; margin-bottom: 2rem; margin-top: 2rem;'>ANNEXURES</h2>";

            annexures.forEach((annexure, index) => {
                // Keep them flowing after the header, but break BETWEEN annexures.

                if (index > 0) {
                    finalHtml += '<div style="page-break-before: always; break-before: page; height: 1px; display: block;"></div>';
                }

                // If this is the first annexure, just add some spacing from the main header
                if (index === 0) {
                    finalHtml += "<br/>";
                }

                finalHtml += `<div class="annexure-section">`;
                finalHtml += `<h3>${annexure.title}</h3>`;
                finalHtml += `<div>${annexure.content.replace(/\n/g, "<br/>")}</div>`;
                finalHtml += `</div>`;
            });
        }

        return finalHtml;
    }

    const handleContractSubmit = async () => {
        if (!selectedTemplate) return;

        setLoading(true);
        try {
            const finalAnnexureData = getOnlyAnnexuresHtml();

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
                annexureData: finalAnnexureData,
            };

            const newContract = await api.contracts.create(payload as any);

            showSuccess("Contract Created", "Redirecting to contract view...");

            // @ts-ignore
            router.push(`/dashboard/contracts/${newContract.id || newContract.reference}`);

        } catch (error: any) {
            console.error("Failed to create contract:", error);
            const message = error.response?.data?.message || error.message || "Unknown error";
            showError("Failed to create contract", Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    // Render Logic
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: return <AIAssistantView onTemplateSelect={handleTemplateSelect} templates={templates} onShowAll={goNext} />;
            case 1: return <TemplateSelectionView onSelect={handleTemplateSelect} selectedTemplateId={selectedTemplate?.id} templates={templates} />;
            case 2: return <ContractDetailsForm data={contractDetails} onChange={setContractDetails} templateName={selectedTemplate?.name} onError={setStepError} />;

            case 3: // Editor
                return (
                    <div className="flex h-[700px] border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 relative animate-in fade-in zoom-in-95 duration-500">
                        {/* Main Editor Surface */}
                        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                            <div className="flex-1 overflow-y-auto relative scroll-smooth">
                                <ContractEditorView
                                    content={editorContent}
                                    onChange={setEditorContent}
                                    onContinue={goNext}
                                    className="border-0 shadow-none rounded-none"
                                    readOnly={true}
                                />
                                {/* Toggle Button when closed */}
                                {!showAiPanel && (
                                    <div className="absolute right-6 top-6 z-30">
                                        <Button
                                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-lg rounded-full h-10 w-10 p-0 flex items-center justify-center group transition-all"
                                            onClick={() => setShowAiPanel(true)}
                                            title="Open AI Assistant"
                                        >
                                            <Wand2 className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Collapsible Sidebar */}
                        <div className={`
                            border-l border-slate-200 bg-white transition-all duration-300 ease-in-out flex flex-col z-20
                             ${showAiPanel ? 'w-[400px] translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0 overflow-hidden'}
                        `}>
                            <div className="h-full flex flex-col min-w-[400px]">
                                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <Wand2 className="w-4 h-4 text-orange-600" />
                                        Contract Assistant
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setShowAiPanel(false)} className="h-7 w-7 text-slate-400 hover:text-slate-700">
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <ContractAssistantSidebar embedded className="h-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4: // Annexures
                return (
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                        <AnnexuresView
                            annexures={annexures}
                            onAnnexureChange={handleAnnexureChange}
                            onUpdate={setAttachedFiles}
                            onAdd={handleAddAnnexure}
                            onRemove={handleRemoveAnnexure}
                            onTitleChange={handleTitleChange}
                        />
                        <div className="p-6 flex justify-end border-t border-slate-50 mt-8">
                            <Button onClick={goNext} className="bg-orange-600 hover:bg-slate-900 text-white font-bold uppercase text-xs tracking-wide h-10 px-8 rounded-xl transition-all shadow-lg shadow-orange-600/20 hover:shadow-xl flex items-center gap-2">
                                Review & Sign <ArrowRight size={14} />
                            </Button>
                        </div>
                    </div>
                );

            case 5: // Final Review (Also collapsible)
                return (
                    <div className="flex h-[700px] border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 relative animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                            <div className="flex-1 overflow-hidden relative">
                                <FinalReviewView
                                    content={getFinalDocumentContent()}
                                    details={contractDetails || {}}
                                    templateName={selectedTemplate?.name}
                                    onSubmit={handleContractSubmit}
                                    loading={loading}
                                    className="border-0 shadow-none rounded-none"
                                />
                                {!showAiPanel && (
                                    <div className="absolute right-4 top-20 z-10">
                                        <Button
                                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-lg rounded-full h-10 w-10 p-0 flex items-center justify-center group transition-all"
                                            onClick={() => setShowAiPanel(true)}
                                            title="Open AI Assistant"
                                        >
                                            <Wand2 className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`
                            border-l border-slate-200 bg-white transition-all duration-300 ease-in-out flex flex-col z-20
                             ${showAiPanel ? 'w-[400px] translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0 overflow-hidden'}
                        `}>
                            <div className="h-full flex flex-col min-w-[400px]">
                                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <Wand2 className="w-4 h-4 text-orange-600" />
                                        Final Checks
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setShowAiPanel(false)} className="h-7 w-7 text-slate-400 hover:text-slate-700">
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <ContractAssistantSidebar embedded className="h-full" />
                                </div>
                            </div>
                        </div>
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
                                disabled={
                                    (currentStep === 2 && (!contractDetails.title || stepError)) ||
                                    loading
                                }
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
