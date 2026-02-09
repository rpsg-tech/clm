'use client';

import { useState } from 'react';
import { AiAssistantPanel } from '@/components/contracts/ai-assistant-panel';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@repo/ui';

interface AiChatWidgetProps {
    contractId?: string;
    onInsertText?: (text: string) => void;
    className?: string;
    defaultOpen?: boolean;
}

export function AiChatWidget({
    contractId = 'draft',
    onInsertText,
    className,
    defaultOpen = false
}: AiChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (isOpen) {
        return (
            <aside className="w-80 bg-white border-l border-neutral-200 flex-shrink-0 flex flex-col h-full shadow-xl shadow-neutral-200/50 z-20">
                <div className="flex justify-start p-2 border-b border-neutral-100">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700 transition-colors"
                        aria-label="Close AI Assistant"
                    >
                        <MaterialIcon name="close" size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <AiAssistantPanel
                        contractId={contractId}
                        onInsertText={onInsertText}
                    />
                </div>
            </aside>
        );
    }

    return (
        <button
            onClick={() => setIsOpen(true)}
            className={cn(
                "fixed bottom-24 right-8 size-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group",
                className
            )}
            title="Open Oracle AI"
            aria-label="Open Oracle AI Assistant"
        >
            <MaterialIcon name="psychology" size={28} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 size-3.5 bg-red-500 rounded-full border-2 border-white" />
        </button>
    );
}
