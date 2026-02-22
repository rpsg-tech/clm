"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Wand2, Search } from "lucide-react";
import { WizardStepper } from "@/components/wizard-stepper";
import { ContractLaunchpad } from "@/components/contract-launchpad";
import { DraftingWorkspace } from "@/components/drafting-workspace";
import { FinalReviewView } from "@/components/final-review-view";
import { ContractAssistantSidebar } from "@/components/contract-assistant-sidebar";
import { ContractMetadataDialog } from "@/components/contract-metadata-dialog";
import { ContractUploadDialog } from "@/components/contract-upload-dialog";
import { VariableFillStep } from "@/components/variable-fill-step";
import { api } from "@/lib/api-client";
import { Template } from "@repo/types";
import { Button, Spinner } from '@repo/ui';
import { useToast } from "@/lib/toast-context";
import { VariableField, applyVariables } from "@/lib/variable-utils";

// Initial single annexure
const INITIAL_ANNEXURES = [
    { id: "annex-a", title: "Price", content: "The Service Provider agrees to perform the following services...\n\n1. Initial Consultation\n2. Implementation Strategy\n3. Ongoing Maintenance" }
];

export default function NewContractPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { success: showSuccess, error: showError } = useToast();

    // View Mode: 'draft' (Workspace), 'variables' (Fill Variables), or 'review' (Final Check)
    const [viewMode, setViewMode] = useState<"draft" | "variables" | "review">("draft");
    const [draftStep, setDraftStep] = useState<'main' | 'annexure'>('main');

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

    // Variable System State
    const [templateVariables, setTemplateVariables] = useState<VariableField[]>([]);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [isLoadingVariables, setIsLoadingVariables] = useState(false);

    // Upload Flow State
    const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [isUploadedContract, setIsUploadedContract] = useState(false);

    // New Feature: Upload Signed Copy Flow
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [createdContractId, setCreatedContractId] = useState<string>("");

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
    const loadFullTemplate = async (template: Template, metadata?: any) => {
        try {
            console.log('Loading full template for:', template.id, template.name);
            // Fetch full template details to get annexure content (list view is optimized/slim)
            const fullTemplate = await api.templates.get(template.id) as any;
            setEditorContent(fullTemplate.baseContent || "");

            // Pre-fill Title logic - ONLY if not already provided in metadata or state
            setContractDetails((prev: any) => {
                const currentTitle = metadata?.title || prev.title;
                if (currentTitle) return { ...prev, ...metadata };

                return {
                    ...prev,
                    ...metadata,
                    title: `${fullTemplate.name} - ${new Date().toLocaleDateString()}`
                };
            });

            // Auto-populate annexures from template
            if ((fullTemplate as any).annexures?.length > 0) {
                setAnnexures((fullTemplate as any).annexures.map((a: any) => ({
                    id: a.id || `annex-${Math.random().toString(36).substr(2, 9)}`,
                    title: a.title || a.name,
                    content: a.content || ""
                })));
            } else {
                setAnnexures(INITIAL_ANNEXURES);
            }

            // Fetch template variables
            try {
                setIsLoadingVariables(true);
                const varResult = await api.templates.getVariables(template.id);
                setTemplateVariables(varResult.variables || []);
                setVariableValues({}); // Reset values for new template
            } catch (varErr) {
                console.warn('Could not fetch template variables:', varErr);
                setTemplateVariables([]);
            } finally {
                setIsLoadingVariables(false);
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

        // Initialize Upload State
        setPendingUploadFile(file);

        // Create Preview URL
        const url = URL.createObjectURL(file);
        setFilePreviewUrl(url);

        // Pre-fill details from file
        const initialDetails = {
            title: file.name.replace(/\.[^/.]+$/, ""), // Auto-fill title
            startDate: new Date().toISOString().split('T')[0] // Default to today
        };

        // Trigger Metadata Dialog
        setPendingTemplate(thirdPartyTemplate);
        setContractDetails(initialDetails); // Pre-fill for the dialog
        setIsMetadataDialogOpen(true);

        // AI ANALYSIS (Background) - DISABLED PER USER REQUEST
        // We upload to temp storage to let AI analyze dates
        // This will update contractDetails in background if successful
        /*
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
                }));
                showSuccess("AI Analysis Complete", `Found expiry date: ${isoDate}`);
            }
        } catch (err) {
            console.error("AI Analysis failed:", err);
            // Non-blocking, just log
        }
        */
    };

    // Dialog State
    const [isMetadataDialogOpen, setIsMetadataDialogOpen] = useState(false);
    const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);

    const handleTemplateSelect = (template: Template) => {
        setPendingTemplate(template);
        setIsMetadataDialogOpen(true);
        setIsUploadedContract(false); // Template-based = enforce workflow
    };

    const handleMetadataConfirm = (data: any) => {
        if (pendingTemplate) {
            setContractDetails(data);
            setSelectedTemplate(pendingTemplate);
            loadFullTemplate(pendingTemplate, data); // Pass data directly to avoid stale state issues
            setIsMetadataDialogOpen(false);
            // If there's a pendingUploadFile, this is an upload contract
            if (pendingUploadFile) {
                setIsUploadedContract(true);
            }
        }
    };

    const resetSelection = () => {
        setSelectedTemplate(null);
        setContractDetails({});
        setEditorContent("");
        setPendingTemplate(null);
        setTemplateVariables([]);
        setVariableValues({});
        setViewMode("draft");
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
            // If template has variables, go to variable fill step first
            if (templateVariables.length > 0) {
                setViewMode("variables");
            } else {
                setViewMode("review");
            }
        } else {
            showError("Input Error", "Please correct the highlighted fields.");
        }
    };

    const handleVariablesFilled = () => {
        setViewMode("review");
    };

    // Helper for saving: only the annexures (with variables applied)
    const getOnlyAnnexuresHtml = () => {
        if (annexures.length === 0) return "";
        let finalHtml = "";
        annexures.forEach((annexure) => {
            const content = templateVariables.length > 0
                ? applyVariables(annexure.content, variableValues, { highlight: false, emptyFallback: '' })
                : annexure.content;
            finalHtml += `<div class="annexure-section">`;
            finalHtml += `<h3>${annexure.title}</h3>`;
            finalHtml += `<div>${content.replace(/\n/g, "<br/>")}</div>`;
            finalHtml += `</div>`;
        });
        return finalHtml;
    };

    // Compile the final document content for PREVIEW (with variables applied)
    const getFinalDocumentContent = () => {
        const mainContent = templateVariables.length > 0
            ? applyVariables(editorContent, variableValues, { highlight: false, emptyFallback: '' })
            : editorContent;
        let finalHtml = mainContent;

        // Append Annexures
        if (annexures.length > 0) {
            finalHtml += '<div style="page-break-before: always; break-before: page; height: 1px; display: block;"></div>';
            finalHtml += "<h2 style='text-align:center; text-transform: uppercase; margin-bottom: 2rem; margin-top: 2rem;'>ANNEXURES</h2>";
            annexures.forEach((annexure, index) => {
                if (index > 0) {
                    finalHtml += '<div style="page-break-before: always; break-before: page; height: 1px; display: block;"></div>';
                }
                if (index === 0) finalHtml += "<br/>";

                const content = templateVariables.length > 0
                    ? applyVariables(annexure.content, variableValues, { highlight: false, emptyFallback: '' })
                    : annexure.content;
                finalHtml += `<div class="annexure-section">`;
                finalHtml += `<h3>${annexure.title}</h3>`;
                finalHtml += `<div>${content.replace(/\n/g, "<br/>")}</div>`;
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
                    counterpartyBusinessName: contractDetails.counterpartyBusinessName,
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
                title: contractDetails.title,
                templateId: selectedTemplate.id,
                counterpartyName: contractDetails.counterpartyName,
                counterpartyBusinessName: contractDetails.counterpartyBusinessName,
                counterpartyEmail: contractDetails.counterpartyEmail,
                startDate: contractDetails.startDate ? new Date(contractDetails.startDate).toISOString() : undefined,
                endDate: contractDetails.endDate ? new Date(contractDetails.endDate).toISOString() : undefined,
                amount: contractDetails.amount ? parseFloat(contractDetails.amount) : undefined,
                description: contractDetails.description || "",
                fieldData: {
                    title: contractDetails.title,
                    termSheet: editorContent,
                    variableValues, // Save filled variable values
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

    const handleUploadSignedFlow = async () => {
        if (!selectedTemplate) return;
        if (!validateForm()) {
            showError("Validation Error", "Please fill in all required fields.");
            return;
        }

        // 1. Create the contract first (if not already created?)
        // For simplicity, we create a new DRAFT contract now.
        setLoading(true);
        try {
            const finalAnnexureData = getOnlyAnnexuresHtml();
            const payload = {
                title: contractDetails.title,
                templateId: selectedTemplate.id,
                counterpartyName: contractDetails.counterpartyName,
                counterpartyBusinessName: contractDetails.counterpartyBusinessName,
                counterpartyEmail: contractDetails.counterpartyEmail,
                startDate: contractDetails.startDate ? new Date(contractDetails.startDate).toISOString() : undefined,
                endDate: contractDetails.endDate ? new Date(contractDetails.endDate).toISOString() : undefined,
                amount: contractDetails.amount ? parseFloat(contractDetails.amount) : undefined,
                description: contractDetails.description || "",
                fieldData: {
                    title: contractDetails.title,
                    termSheet: editorContent,
                    ...contractDetails
                },
                annexureData: finalAnnexureData,
            };

            // @ts-ignore
            const newContract = await api.contracts.create(payload);
            // @ts-ignore
            setCreatedContractId(newContract.id);
            setIsUploadDialogOpen(true);
        } catch (error: any) {
            console.error("Failed to create contract for upload:", error);
            showError("Creation Failed", "Could not prepare contract for upload.");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = (data: any) => {
        setIsUploadDialogOpen(false);
        // Redirect to the contract
        // @ts-ignore
        router.push(`/dashboard/contracts/${createdContractId}`);
    };

    return (
        <div className="max-w-[1600px] mx-auto selection:bg-orange-100">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-2 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create New Contract</h1>
                </div>

                <div className="flex items-center gap-4">
                    {(selectedTemplate || viewMode === "review") && !isUploadedContract && (
                        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {[
                                { label: 'Main Agreement', active: viewMode === "draft" && draftStep === 'main' },
                                { label: 'Annexures', active: viewMode === "draft" && draftStep === 'annexure' },
                                ...(templateVariables.length > 0 ? [{ label: 'Fill Variables', active: viewMode === "variables" }] : []),
                                { label: 'Final Review', active: viewMode === "review" }
                            ].map((step, index) => (
                                <div key={step.label} className="flex items-center gap-2">
                                    <span className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${step.active ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                                        {index + 1}
                                    </span>
                                    <span className={`${step.active ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                                    {index < (templateVariables.length > 0 ? 3 : 2) && <span className="h-[1px] w-5 bg-slate-200" />}
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === "review" && (
                        // Removed Back to Edit button from here
                        <></>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-0">
                {isLoadingTemplates ? (
                    <div className="flex h-[400px] items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Spinner size="lg" color="orange" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Workspace...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {viewMode === "variables" && (
                            <div className="flex flex-col" style={{ height: 'calc(100svh - 140px)' }}>
                                <VariableFillStep
                                    variables={templateVariables}
                                    values={variableValues}
                                    onChange={setVariableValues}
                                    previewContent={editorContent}
                                    annexures={annexures}
                                    templateName={selectedTemplate?.name}
                                    onNext={handleVariablesFilled}
                                    onBack={() => setViewMode("draft")}
                                />
                            </div>
                        )}

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
                                isUploadedContract={isUploadedContract} // Skip workflow for uploads
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
                                onStepChange={setDraftStep}
                                onNext={handleProceedToReview}
                                onBack={resetSelection}
                            />
                        )}

                        {viewMode === "review" && (
                            <div className="flex h-[calc(100svh-90px)] md:h-[calc(100svh-140px)] w-full border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 relative animate-in fade-in zoom-in-95 duration-500">
                                <FinalReviewView
                                    content={getFinalDocumentContent()}
                                    details={contractDetails || {}}
                                    templateName={selectedTemplate?.name}
                                    filePreviewUrl={filePreviewUrl}
                                    onSubmit={handleContractSubmit}
                                    onBackToEdit={() => setViewMode("draft")}
                                    onReject={(comment) => {
                                        console.log("Contract discarded/rejected with comment:", comment);
                                        setViewMode("draft");
                                        // Specific rejection logic for creation phase could be added here
                                    }}
                                    loading={loading}
                                    className="border-0 shadow-none rounded-none"
                                    isAiOpen={showAiPanel}
                                    onToggleAi={setShowAiPanel}
                                    onUploadSignedCopy={handleUploadSignedFlow}
                                />
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

            <ContractUploadDialog
                isOpen={isUploadDialogOpen}
                onClose={() => setIsUploadDialogOpen(false)}
                contractId={createdContractId}
                contractTitle={contractDetails.title}
                onUploadComplete={handleUploadComplete}
            />
        </div>
    );
}
