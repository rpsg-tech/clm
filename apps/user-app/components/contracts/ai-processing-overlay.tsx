'use client';

import { useState, useEffect } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';

interface AiProcessingOverlayProps {
    isProcessing: boolean;
}

const STATUS_MESSAGES = [
    'Scanning document...',
    'Extracting metadata...',
    'Analyzing clauses...',
    'Identifying key dates...',
    'Almost done...',
];

export function AiProcessingOverlay({ isProcessing }: AiProcessingOverlayProps) {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (!isProcessing) {
            setMessageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [isProcessing]);

    if (!isProcessing) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center text-center max-w-sm">
                <div className="size-20 rounded-2xl bg-violet-100 flex items-center justify-center mb-6 animate-pulse">
                    <MaterialIcon name="auto_awesome" size={36} className="text-violet-700" />
                </div>

                <h2 className="text-xl font-bold text-neutral-900 mb-2">Processing Document</h2>
                <p className="text-sm text-violet-700 font-medium mb-6 h-5 transition-all duration-300">
                    {STATUS_MESSAGES[messageIndex]}
                </p>

                <div className="w-64 h-1.5 rounded-full bg-violet-100 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-600 animate-progress" />
                </div>

                <p className="text-xs text-neutral-400 mt-4">
                    AI is extracting key information from your document
                </p>
            </div>

            <style jsx>{`
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    90% { width: 90%; }
                    100% { width: 95%; }
                }
                .animate-progress {
                    animation: progress 6s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
