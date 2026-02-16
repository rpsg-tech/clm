"use client";

import { useState, useEffect } from 'react';
import { Save, Check, AlertCircle } from 'lucide-react';

interface AutoSaveIndicatorProps {
    onSave?: () => Promise<void>;
    debounceMs?: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function AutoSaveIndicator({ onSave, debounceMs = 2000 }: AutoSaveIndicatorProps) {
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const getStatusDisplay = () => {
        switch (status) {
            case 'saving':
                return {
                    icon: <Save size={14} className="animate-pulse text-orange-500" />,
                    text: 'Saving...',
                    color: 'text-orange-600',
                };
            case 'saved':
                return {
                    icon: <Check size={14} className="text-emerald-500" />,
                    text: 'Saved',
                    color: 'text-emerald-600',
                };
            case 'error':
                return {
                    icon: <AlertCircle size={14} className="text-rose-500" />,
                    text: 'Save failed',
                    color: 'text-rose-600',
                };
            default:
                return null;
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleTimeString();
    };

    const display = getStatusDisplay();

    if (!display && !lastSaved) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            {display && (
                <div className="flex items-center gap-1.5">
                    {display.icon}
                    <span className={`text-xs font-medium ${display.color}`}>
                        {display.text}
                    </span>
                </div>
            )}
            {lastSaved && status === 'saved' && (
                <span className="text-xs text-slate-500">
                    {formatTimestamp(lastSaved)}
                </span>
            )}
        </div>
    );
}

// Hook for auto-save functionality
export function useAutoSave(
    content: string,
    saveFunction: (content: string) => Promise<void>,
    debounceMs: number = 2000
) {
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        if (!content) return;

        const timer = setTimeout(async () => {
            try {
                setStatus('saving');
                await saveFunction(content);
                setStatus('saved');
                setLastSaved(new Date());

                // Reset to idle after 3 seconds
                setTimeout(() => setStatus('idle'), 3000);
            } catch (error) {
                setStatus('error');
                console.error('Auto-save failed:', error);
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [content, saveFunction, debounceMs]);

    return { status, lastSaved };
}
