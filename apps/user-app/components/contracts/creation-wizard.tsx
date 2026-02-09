'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { Stepper } from '@/components/ui/stepper';
import { SetupStep, type ContractSetup } from './wizard-steps/setup-step';
import { PartAPreviewStep } from './wizard-steps/part-a-preview-step';
import { AnnexureEditorStep } from './wizard-steps/annexure-editor-step';
import { PreviewStep } from './wizard-steps/preview-step';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button } from '@repo/ui';

const STEPS = [
    { number: 1, label: 'Setup' },
    { number: 2, label: 'Part A Preview' },
    { number: 3, label: 'Edit Annexures' },
    { number: 4, label: 'Preview' },
];

interface CreationWizardProps {
    templateId: string;
    templateName: string;
    templateContent: string;
    templateAnnexures: string;
}

export function CreationWizard({ templateId, templateName, templateContent, templateAnnexures }: CreationWizardProps) {
    const router = useRouter();
    const { success, error: showError } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [setup, setSetup] = useState<ContractSetup>({
        title: '',
        counterpartyName: '',
        counterpartyEmail: '',
        counterpartyAddress: '',
        startDate: '',
        endDate: '',
        description: '',
        amount: '',
        paymentTerms: '',
    });

    const [annexureContent, setAnnexureContent] = useState<string>(templateAnnexures);

    function validateStep(step: number): string | null {
        if (step === 1) {
            if (!setup.title.trim()) return 'Contract title is required.';
            if (!setup.counterpartyName.trim()) return 'Counterparty name is required.';
        }
        return null;
    }

    function handleNext() {
        const validationError = validateStep(currentStep);
        if (validationError) {
            showError('Validation Error', validationError);
            return;
        }
        setCurrentStep((s) => Math.min(s + 1, 4));
    }

    function handleBack() {
        setCurrentStep((s) => Math.max(s - 1, 1));
    }

    async function handleCreate() {
        const validationError = validateStep(1);
        if (validationError) {
            showError('Validation Error', validationError);
            setCurrentStep(1);
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await api.contracts.create({
                templateId,
                title: setup.title.trim(),
                counterpartyName: setup.counterpartyName.trim() || undefined,
                counterpartyEmail: setup.counterpartyEmail.trim() || undefined,
                startDate: setup.startDate || undefined,
                endDate: setup.endDate || undefined,
                amount: setup.amount ? parseFloat(setup.amount) : undefined,
                description: setup.description.trim() || undefined,
                annexureData: annexureContent,
                fieldData: {
                    counterpartyAddress: setup.counterpartyAddress,
                    paymentTerms: setup.paymentTerms,
                },
            });

            success('Contract Created', `"${setup.title}" has been saved as a draft.`);
            const contractId = (result as { id: string })?.id;
            router.push(contractId ? `/dashboard/contracts/${contractId}` : '/dashboard/contracts');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create contract.';
            showError('Creation Failed', message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className={currentStep <= 2 ? 'max-w-2xl mx-auto' : ''}>
            {/* Stepper */}
            <div className="mb-8 max-w-2xl mx-auto">
                <Stepper steps={STEPS} currentStep={currentStep} />
            </div>

            {/* Step content */}
            <div className="mb-8">
                {currentStep === 1 && (
                    <SetupStep
                        data={setup}
                        onChange={setSetup}
                        templateName={templateName}
                    />
                )}
                {currentStep === 2 && (
                    <PartAPreviewStep
                        templateContent={templateContent}
                        templateName={templateName}
                    />
                )}
                {currentStep === 3 && (
                    <AnnexureEditorStep
                        templateContent={templateContent}
                        annexureContent={annexureContent}
                        onAnnexureChange={setAnnexureContent}
                    />
                )}
                {currentStep === 4 && (
                    <PreviewStep
                        templateContent={templateContent}
                        annexureContent={annexureContent}
                        contractTitle={setup.title || 'Untitled Agreement'}
                    />
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-200 max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={currentStep === 1 ? () => router.back() : handleBack}
                    disabled={isSubmitting}
                >
                    <MaterialIcon name="arrow_back" size={16} className="mr-1.5" />
                    Back
                </Button>

                {currentStep < 4 ? (
                    <Button
                        onClick={handleNext}
                        className="bg-primary-700 hover:bg-primary-800 text-white"
                    >
                        {currentStep === 1
                            ? 'Next: Preview Template'
                            : currentStep === 2
                                ? 'Continue to Edit Annexures'
                                : 'Preview Full Document'}
                        <MaterialIcon name="arrow_forward" size={16} className="text-white ml-1.5" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleCreate}
                        disabled={isSubmitting}
                        className="bg-primary-700 hover:bg-primary-800 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <MaterialIcon name="refresh" size={16} className="text-white mr-1.5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <MaterialIcon name="save" size={16} className="text-white mr-1.5" />
                                Save as Draft
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
