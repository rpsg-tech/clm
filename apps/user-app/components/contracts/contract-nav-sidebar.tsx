'use client';

import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@repo/ui';
import type { Contract, Annexure } from '@repo/types';

interface ContractNavSidebarProps {
    contract: Contract & { template?: { annexures?: Annexure[] } | null };
}

export function ContractNavSidebar({ contract }: ContractNavSidebarProps) {
    // Extract sections from contract content (Part A)
    // For now, use static section list or parse from template
    const partASections = [
        { id: 'definitions', label: '1. Definitions' },
        { id: 'scope', label: '2. Scope of Services' },
        { id: 'payment', label: '3. Payment Terms' },
        { id: 'confidentiality', label: '4. Confidentiality' },
    ];

    // Part B annexures from template or contract
    const annexures: Array<Pick<Annexure, 'id' | 'name'>> = contract.template?.annexures
        ? contract.template.annexures.map((annexure) => ({
              id: annexure.id,
              name: annexure.name,
          }))
        : [
              { id: 'annex-a', name: 'Annex A: Specifications' },
              { id: 'annex-b', name: 'Annex B: Pricing Schedule' },
          ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Document Outline
                </h2>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Part A header */}
                <div className="px-3 py-2 mt-2 flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <span>Part A: Legal Terms</span>
                    <MaterialIcon name="lock" size={14} />
                </div>

                {/* Part A items — locked */}
                {partASections.map((section) => (
                    <button
                        key={section.id}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50 rounded-md"
                    >
                        <MaterialIcon name="lock" size={16} className="text-neutral-400" />
                        <span>{section.label}</span>
                    </button>
                ))}

                {/* Part B header */}
                <div className="px-3 py-2 mt-6 flex items-center justify-between text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    <span>Part B: Annexures</span>
                    <MaterialIcon name="edit_note" size={14} />
                </div>

                {/* Part B items — editable */}
                {annexures.map((annexure, i) => (
                    <button
                        key={annexure.id || i}
                        className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md',
                            i === 0
                                ? 'text-indigo-700 bg-indigo-50 font-medium'
                                : 'text-neutral-700 hover:bg-neutral-50 group'
                        )}
                    >
                        <MaterialIcon
                            name="edit"
                            size={16}
                            className={i === 0 ? '' : 'text-neutral-400 group-hover:text-indigo-600'}
                        />
                        <span>{annexure.name || `Annexure ${i + 1}`}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
