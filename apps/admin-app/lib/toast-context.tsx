'use client';

/**
 * Toast Notification System
 * 
 * Lightweight toast notifications using context and CSS animations.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const toastIcons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

const toastStyles: Record<ToastType, string> = {
    success: 'bg-success-light border-success text-success-dark',
    error: 'bg-error-light border-error text-error-dark',
    warning: 'bg-warning-light border-warning text-warning-dark',
    info: 'bg-info-light border-info text-info-dark',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...toast, id };

        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback(
        (title: string, message?: string) => addToast({ type: 'success', title, message }),
        [addToast],
    );

    const error = useCallback(
        (title: string, message?: string) => addToast({ type: 'error', title, message }),
        [addToast],
    );

    const warning = useCallback(
        (title: string, message?: string) => addToast({ type: 'warning', title, message }),
        [addToast],
    );

    const info = useCallback(
        (title: string, message?: string) => addToast({ type: 'info', title, message }),
        [addToast],
    );

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto p-4 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-up ${toastStyles[toast.type]}`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-lg font-bold">{toastIcons[toast.type]}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold">{toast.title}</p>
                                {toast.message && (
                                    <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-current opacity-50 hover:opacity-100 transition-opacity"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
