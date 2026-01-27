import { Check } from "lucide-react";
import { Card, CardContent } from "@repo/ui";

interface WizardStepperProps {
    currentStep: number;
    steps: string[];
}

export function WizardStepper({ currentStep, steps }: WizardStepperProps) {
    return (
        <Card className="border border-gray-200 shadow-sm mb-8">
            <CardContent className="pt-8 pb-8 px-8">
                <div className="flex items-center justify-between w-full">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const isLast = index === steps.length - 1;

                        return (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center relative z-10">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isCompleted
                                            ? 'bg-orange-500 text-white shadow-md'
                                            : isCurrent
                                                ? 'bg-orange-600 text-white ring-4 ring-orange-100 shadow-lg scale-110'
                                                : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                                            }`}
                                    >

                                        {/* User requested to see 1-6 progress numbers explicitly */}
                                        {index + 1}
                                    </div>

                                    {/* Label */}
                                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-32 text-center">
                                        <p className={`text-xs font-semibold whitespace-nowrap transition-colors ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-orange-500' : 'text-neutral-400'
                                            }`}>
                                            {step}
                                        </p>
                                    </div>
                                </div>

                                {!isLast && (
                                    <div className={`flex-1 h-1 mx-4 transition-all duration-500 rounded-full ${isCompleted ? 'bg-orange-500' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
