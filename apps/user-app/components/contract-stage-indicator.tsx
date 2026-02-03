"use client";

import { CheckCircle, Circle, Clock, Loader2 } from "lucide-react";

// The 3 Consolidated Stages
const STAGES = [
    {
        id: "DRAFT",
        label: "Draft",
        description: "Authoring & Editing",
        includedStatuses: ["DRAFT"]
    },
    {
        id: "REVIEW",
        label: "Review",
        description: "Internal Approval",
        includedStatuses: ["PENDING_LEGAL", "PENDING_FINANCE", "LEGAL_APPROVED", "FINANCE_APPROVED", "APPROVED", "REJECTED"]
    },
    {
        id: "SIGN",
        label: "Sign",
        description: "Execution & Active",
        includedStatuses: ["SENT_TO_COUNTERPARTY", "COUNTERSIGNED", "ACTIVE", "EXPIRED", "TERMINATED", "CANCELLED"]
    }
];

export function ContractStageIndicator({ currentStatus }: { currentStatus: string }) {
    // Determine current simplified stage index
    const currentStageIndex = STAGES.findIndex(s => s.includedStatuses.includes(currentStatus));

    // Fallback if status is unknown (shouldn't happen)
    const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

    return (
        <div className="w-full max-w-3xl mx-auto my-6 px-4">
            <div className="relative flex items-center justify-between">

                {/* Connecting Line */}
                <div className="absolute left-0 top-5 w-full h-0.5 bg-slate-100 -z-10 rounded-full" />
                <div
                    className="absolute left-0 top-5 h-0.5 bg-orange-500 -z-10 transition-all duration-500 ease-in-out rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                    style={{ width: `${(activeIndex / (STAGES.length - 1)) * 100}%` }}
                />

                {STAGES.map((stage, index) => {
                    const isCompleted = index < activeIndex;
                    const isCurrent = index === activeIndex;
                    const isFuture = index > activeIndex;

                    return (
                        <div key={stage.id} className="flex flex-col items-center group cursor-default">
                            {/* Circle Indicator */}
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10
                                ${isCompleted
                                    ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20"
                                    : isCurrent
                                        ? "bg-white border-orange-500 text-orange-600 shadow-xl shadow-orange-500/20 scale-110"
                                        : "bg-white border-slate-200 text-slate-300"
                                }
                            `}>
                                {isCompleted ? (
                                    <CheckCircle size={18} strokeWidth={3} />
                                ) : isCurrent ? (
                                    <Loader2 size={18} className="animate-spin-slow" />
                                ) : (
                                    <Circle size={18} />
                                )}
                            </div>

                            {/* Labels */}
                            <div className="mt-3 text-center space-y-0.5">
                                <p className={`
                                    text-xs font-bold uppercase tracking-wider transition-colors duration-300
                                    ${isCurrent ? "text-orange-600" : isCompleted ? "text-slate-700" : "text-slate-400"}
                                `}>
                                    {stage.label}
                                </p>
                                <p className={`
                                    text-[10px] font-medium hidden sm:block transition-colors duration-300
                                    ${isCurrent ? "text-slate-500" : "text-slate-300"}
                                `}>
                                    {stage.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
