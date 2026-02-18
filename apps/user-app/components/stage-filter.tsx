'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface StageFilterProps {
    value: string;
    onChange: (value: string) => void;
}

const stages = [
    { value: '', label: 'All Contract Stages' },
    { value: 'DRAFT', label: 'Draft' }, // Mapping to system status but using user friendly labels where possible or adding new mappings if system supports 'Received from User' etc.
    // For now mapping strictly to what backend supports but updating labels to match screenshot style where applicable
    { value: 'SENT_TO_LEGAL', label: 'Legal Review' },
    { value: 'SENT_TO_FINANCE', label: 'Finance Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'SENT_TO_COUNTERPARTY', label: 'Sent to Counterparty' },
    { value: 'ACTIVE', label: 'Active' },
];

export function StageFilter({ value, onChange }: StageFilterProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedLabel = stages.find(s => s.value === value)?.label || 'All Contract Stages';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full lg:min-w-[220px] px-4 py-2.5 bg-white border-2 border-neutral-200 rounded-xl text-sm text-neutral-700 font-semibold hover:border-primary-500 hover:text-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 shadow-sm active:scale-[0.98]"
            >
                <span>{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-xl shadow-xl border border-neutral-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-2">
                        {stages.map((stage) => (
                            <button
                                key={stage.value}
                                onClick={() => {
                                    onChange(stage.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all duration-200 ${value === stage.value
                                    ? 'bg-primary-50 text-primary-700 font-semibold'
                                    : 'text-neutral-600 hover:bg-neutral-50 font-normal'
                                    }`}
                            >
                                {stage.label}
                                {value === stage.value && <Check className="w-4 h-4 text-primary-600" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}
