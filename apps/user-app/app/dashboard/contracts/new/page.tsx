"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Wand2, Search } from "lucide-react";
import { WizardStepper } from "@/components/wizard-stepper"; // Likely irrelevant now, but keeping if needed for 'Review' phase only
import { ContractLaunchpad } from "@/components/contract-launchpad";
import { DraftingWorkspace } from "@/components/drafting-workspace";
import { FinalReviewView } from "@/components/final-review-view";
import { ContractAssistantSidebar } from "@/components/contract-assistant-sidebar";
import { ContractMetadataDialog } from "@/components/contract-metadata-dialog";
import { api } from "@/lib/api-client";
import { Template } from "@repo/types";
import { Button, Spinner } from '@repo/ui';
import { useToast } from "@/lib/toast-context";

// Initial single annexure
const INITIAL_ANNEXURES = [
    { id: "annex-a", title: "Price", content: "The Service Provider agrees to perform the following services...\n\n1. Initial Consultation\n2. Implementation Strategy\n3. Ongoing Maintenance" }
];

export default function NewContractPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { success: showSuccess, error: showError } = useToast();

    // View Mode: 'draft' (Workspace) or 'review' (Final Check)
    // Note: 'setup' is now just 'draft' with no template selected.
    const [viewMode, setViewMode] = useState<"draft" | "review">("draft");

    const [loading, setLoading] = useState(false);
    const [showAiPanel, setShowAiPanel] = useState(false);

    // Data State
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

    // Contract State
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [contractDetails, setContractDetails] = useState<any>({});
    const [editorContent, setEditorContent] = useState("");
    const [annexures, setAnnexures] = useState<any[]>(INITIAL_ANNEXURES);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    // Upload Flow State
    const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

    // Cleanup object URL on unmount or file change
    useEffect(() => {
        return () => {
            if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
        };
    }, [filePreviewUrl]);

    // Validation State
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await api.templates.list({ limit: 50 });
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
                handleTemplateSelect(t);
            }
        }
    }, [templates, searchParams]);

    // Initialize editor content and annexures when template is selected
    const loadFullTemplate = async (template: Template) => {
        try {
            // Fetch full template details to get annexure content (list view is optimized/slim)
            const fullTemplate = await api.templates.get(template.id) as any;
            setEditorContent(fullTemplate.baseContent || "");

            // Pre-fill Title logic
            if (!contractDetails.title) {
                setContractDetails((prev: any) => ({
                    ...prev,
                    title: `${fullTemplate.name} - ${new Date().toLocaleDateString()}`
                }));
            }

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
            // Fallback
            setEditorContent(template.baseContent || "");
            setAnnexures(INITIAL_ANNEXURES);
        }
    };

    const handleUpload = async (file: File) => {
        let thirdPartyTemplate = templates.find(t => t.code === 'THIRD_PARTY' || t.name === 'Third Party Contract');

        // Fallback: If not found in list, try to fetch it directly
        if (!thirdPartyTemplate) {
            try {
                const searchRes = await api.templates.list({ search: 'Third Party', limit: 1 });
                // @ts-ignore
                if (searchRes.data && searchRes.data.length > 0) {
                    // @ts-ignore
                    thirdPartyTemplate = searchRes.data[0] as Template;
                }
            } catch (err) {
                console.error("Failed to search for fallback template", err);
            }
        }

        if (!thirdPartyTemplate) {
            showError("Configuration Error", "Third Party Contract template not found. Please contact support.");
            return;
        }

        // Initialize Workspace for Upload
        setPendingUploadFile(file);
        setSelectedTemplate(thirdPartyTemplate);

        // Create Preview URL
        const url = URL.createObjectURL(file);
        setFilePreviewUrl(url);

        // Pre-fill details from file (Preserve existing inputs)
        setContractDetails((prev: any) => ({
            ...prev,
            title: prev.title || file.name.replace(/\.[^/.]+$/, ""), // Only auto-fill title if empty
        }));

        // Clear editor content (we'll show preview instead)
        setEditorContent("");

        // No annexures for raw file upload by default
        setAnnexures([]);

        // AI ANALYSIS TRIGGER
        // We upload to temp storage to let AI analyze dates
        try {
            showSuccess("Analyzing...", "AI is reading the contract dates");

            // 1. Get Temp Upload URL
            const { uploadUrl, key } = await api.ai.getUploadUrl(file.name, file.type);

            // 2. Upload to S3
            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            // 3. Analyze
            const analysis = await api.ai.analyzeFile(key);

            if (analysis.expiryDate) {
                const expiry = new Date(analysis.expiryDate);
                const isoDate = expiry.toISOString().split('T')[0];

                setContractDetails((prev: any) => ({
                    ...prev,
                    endDate: isoDate,
                    // If we found an end date, maybe set start date to today if missing?
                    startDate: prev.startDate || new Date().toISOString().split('T')[0]
                }));
                showSuccess("AI Analysis Complete", `Found expiry date: ${isoDate}`);
            }
        } catch (err) {
            console.error("AI Analysis failed:", err);
            // Non-blocking, just log
        }
    };

    // Dialog State
    const [isMetadataDialogOpen, setIsMetadataDialogOpen] = useState(false);
    const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);

    const handleTemplateSelect = (template: Template) => {
        setPendingTemplate(template);
        setIsMetadataDialogOpen(true);
    };

    const handleMetadataConfirm = (data: any) => {
        if (pendingTemplate) {
            setContractDetails(data);
            setSelectedTemplate(pendingTemplate);
            loadFullTemplate(pendingTemplate); // Triggers content load
            setIsMetadataDialogOpen(false);
        }
    };

    const resetSelection = () => {
        setSelectedTemplate(null);
        setContractDetails({});
        setEditorContent("");
        setPendingTemplate(null);
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

    // Validation
    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!contractDetails.title) newErrors.title = "Title is required";
        else if (contractDetails.title.length < 3) newErrors.title = "Title too short";

        if (!contractDetails.counterpartyName) newErrors.counterpartyName = "Required";

        if (!contractDetails.counterpartyEmail) {
            newErrors.counterpartyEmail = "Required";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contractDetails.counterpartyEmail)) {
                newErrors.counterpartyEmail = "Invalid email format";
            }
        }

        if (contractDetails.startDate) {
            const start = new Date(contractDetails.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (start < today) {
                newErrors.date = "Start date cannot be in the past";
            }
        }

        if (contractDetails.startDate && contractDetails.endDate) {
            if (new Date(contractDetails.endDate) <= new Date(contractDetails.startDate)) {
                newErrors.date = "End date must be after Start date";
            }
        }
        setErrors(newErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Granular Validation (On Blur)
    const handleValidateField = (field: string, value: string) => {
        const newErrors = { ...errors };

        if (field === "title") {
            if (!value || value.length < 3) newErrors.title = "Title too short (min 3 chars)";
            else delete newErrors.title;
        }

        if (field === "counterpartyName") {
            if (!value) newErrors.counterpartyName = "Required";
            else delete newErrors.counterpartyName;
        }

        if (field === "counterpartyEmail") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                newErrors.counterpartyEmail = "Required";
            } else if (!emailRegex.test(value)) {
                newErrors.counterpartyEmail = "Invalid email format";
            } else {
                delete newErrors.counterpartyEmail;
            }
        }

        if (field === "startDate" || field === "endDate") {
            const start = field === "startDate" ? value : contractDetails.startDate;
            const end = field === "endDate" ? value : contractDetails.endDate;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (start && new Date(start) < today) {
                newErrors.date = "Start date cannot be in the past";
            } else if (start && end && new Date(end) <= new Date(start)) {
                newErrors.date = "End date must be after Start date";
            } else {
                delete newErrors.date;
            }
        }

        setErrors(newErrors);
    };

    const handleProceedToReview = () => {
        if (validateForm()) {
            setViewMode("review");
        } else {
            showError("Input Error", "Please correct the highlighted fields.");
        }
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
            finalHtml += '<div style="page-break-before: always; break-before: page; height: 1px; display: block;"></div>';
            finalHtml += "<h2 style='text-align:center; text-transform: uppercase; margin-bottom: 2rem; margin-top: 2rem;'>ANNEXURES</h2>";
            annexures.forEach((annexure, index) => {
                if (index > 0) {
                    finalHtml += '<div style="page-break-before: always; break-before: page; height: 1px; display: block;"></div>';
                }
                if (index === 0) finalHtml += "<br/>";

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

        // Re-validate before final submission
        if (!validateForm()) {
            showError("Validation Error", "Please fill in all required fields (Title, Counterparty).");
            // Optionally switch back to draft mode to show errors, or just show toast
            // setViewMode("draft"); 
            return;
        }

        setLoading(true);
        try {
            // A. UPLOAD FLOW
            if (pendingUploadFile) {
                const payload = {
                    title: contractDetails.title,
                    templateId: selectedTemplate.id,
                    counterpartyName: contractDetails.counterpartyName,
                    counterpartyEmail: contractDetails.counterpartyEmail,
                    startDate: contractDetails.startDate ? new Date(contractDetails.startDate).toISOString() : undefined,
                    endDate: contractDetails.endDate ? new Date(contractDetails.endDate).toISOString() : undefined,
                    amount: contractDetails.amount ? parseFloat(contractDetails.amount) : undefined,
                    description: contractDetails.description || "Uploaded Contract",
                    fieldData: {
                        ...contractDetails,
                        originalFileName: pendingUploadFile.name
                    },
                    annexureData: "" // No HTML content for upload flow usually
                };

                // 1. Create
                // @ts-ignore
                const newContract = await api.contracts.create(payload);
                const contractId = (newContract as any).id;

                // 2. Upload URL
                const { uploadUrl, key } = await api.contracts.getDocumentUploadUrl(contractId, pendingUploadFile.name, pendingUploadFile.type);

                // 3. S3 Put
                await fetch(uploadUrl, {
                    method: 'PUT',
                    body: pendingUploadFile,
                    headers: { 'Content-Type': pendingUploadFile.type }
                });

                // 4. Confirm
                await api.contracts.confirmDocumentUpload(contractId, key, pendingUploadFile.name, pendingUploadFile.size);

                showSuccess("Contract Uploaded", "Redirecting to contract view...");
                // @ts-ignore
                router.push(`/dashboard/contracts/${contractId}`);
                return;
            }

            // B. STANDARD TEMPLATE FLOW
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
                    termSheet: editorContent, // Send edited content as 'termSheet'
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

    return (
        <div className="max-w-[1600px] mx-auto py-8 px-6 pb-20 selection:bg-orange-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create New Contract</h1>
                    <p className="text-slate-500 font-medium text-sm">Unified workspace for seamless drafting.</p>
                </div>

                {viewMode === "review" && (
                    <Button
                        onClick={() => setViewMode("draft")}
                        variant="ghost"
                        className="flex items-center gap-2 h-9 px-4 text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                    >
                        <ArrowLeft size={14} />
                        Back to Edit
                    </Button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="min-h-[500px]">
                {isLoadingTemplates ? (
                    <div className="flex h-[400px] items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Spinner size="lg" color="orange" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Workspace...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {viewMode === "draft" && (
                            <DraftingWorkspace
                                contractDetails={contractDetails}
                                editorContent={editorContent}
                                annexures={annexures}
                                attachedFiles={attachedFiles}
                                templateName={selectedTemplate?.name}
                                // Core Logic for Unified View:
                                startWithLaunchpad={!selectedTemplate}
                                renderLaunchpad={() => (
                                    <ContractLaunchpad
                                        templates={templates}
                                        onSelect={handleTemplateSelect}
                                        onUpload={handleUpload}
                                        isLoading={isLoadingTemplates}
                                    />
                                )}
                                errors={errors}
                                mainContentReadOnly={true} // Main Agreement matches template, strictly read-only per user request
                                filePreviewUrl={filePreviewUrl} // Pass preview URL
                                onValidate={handleValidateField}
                                onDetailsChange={(data) => {
                                    setContractDetails(data);
                                    // Don't auto-clear all errors on every keystroke. 
                                    // Let validation check happen on next submit, 
                                    // or arguably we could clear specific errors if we knew the field.
                                    // For now, let's just NOT clear them blindly.
                                    // Actually, a better UX is to clear global errors but re-validate?
                                    // No, let's just remove the aggressive clear.
                                    // Users will re-click "Final Review" to check again.
                                }}
                                onEditorChange={setEditorContent}
                                onAnnexuresChange={handleAnnexureChange}
                                onAnnexuresUpdate={setAttachedFiles}
                                onAddAnnexure={handleAddAnnexure}
                                onRemoveAnnexure={handleRemoveAnnexure}
                                onAnnexureTitleChange={handleTitleChange}
                                onNext={handleProceedToReview}
                                onBack={resetSelection}
                            />
                        )}

                        {viewMode === "review" && (
                            <div className="flex h-[700px] border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 relative animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                                    <FinalReviewView
                                        content={getFinalDocumentContent()}
                                        details={contractDetails || {}}
                                        templateName={selectedTemplate?.name}
                                        filePreviewUrl={filePreviewUrl}
                                        onSubmit={handleContractSubmit}
                                        loading={loading}
                                        className="border-0 shadow-none rounded-none"
                                    />
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

                                <div className={`
                                border-l border-slate-200 bg-white transition-all duration-300 ease-in-out flex flex-col z-30
                                 ${showAiPanel ? 'w-[85vw] sm:w-[400px] translate-x-0 opacity-100 max-xl:absolute max-xl:right-0 max-xl:h-full max-xl:shadow-2xl' : 'w-0 translate-x-full opacity-0 overflow-hidden'}
                            `}>
                                    <div className="h-full flex flex-col min-w-full">
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
                                            <ContractAssistantSidebar embedded className="h-full" content={getFinalDocumentContent()} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ContractMetadataDialog
                isOpen={isMetadataDialogOpen}
                onClose={() => setIsMetadataDialogOpen(false)}
                onConfirm={handleMetadataConfirm}
                templateName={pendingTemplate?.name}
            />
        </div>
    );
}
