'use client';

import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@repo/ui';

interface Step {
    label: string;
    number: number;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
    return (
        <div className="flex items-center justify-center gap-0">
            {steps.map((step, index) => {
                const isCompleted = step.number < currentStep;
                const isCurrent = step.number === currentStep;

                return (
                    <div key={step.number} className="flex items-center">
                        {/* Step circle */}
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'size-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                                    isCompleted
                                        ? 'bg-primary-700 text-white'
                                        : isCurrent
                                          ? 'bg-primary-700 text-white ring-4 ring-primary-100'
                                          : 'bg-neutral-200 text-neutral-500'
                                )}
                            >
                                {isCompleted ? (
                                    <MaterialIcon name="check" size={18} className="text-white" />
                                ) : (
                                    step.number
                                )}
                            </div>
                            <span
                                className={cn(
                                    'mt-1.5 text-xs font-medium',
                                    isCurrent ? 'text-primary-700' : 'text-neutral-500'
                                )}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    'w-16 sm:w-24 h-0.5 mx-2 mb-5',
                                    isCompleted ? 'bg-primary-700' : 'bg-neutral-200'
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
