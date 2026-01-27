'use client';

import { useEffect } from 'react';
import { Button } from '@repo/ui';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Runtime Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">

                <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-100">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                </div>

                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Something went wrong</h2>
                    <p className="text-slate-500">
                        We encountered an unexpected error while processing your request. Our engineering team has been notified.
                    </p>
                    {error.digest && (
                        <p className="text-xs font-mono text-slate-400 bg-slate-50 p-2 rounded border border-slate-100 inline-block mt-2">
                            Reference ID: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button
                        onClick={() => reset()}
                        className="bg-slate-900 text-white hover:bg-slate-800 gap-2 min-w-[140px]"
                        size="lg"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Try Again
                    </Button>
                    <Button
                        onClick={() => window.location.href = '/dashboard'}
                        variant="outline"
                        className="gap-2 min-w-[140px]"
                        size="lg"
                    >
                        <Home className="w-4 h-4" />
                        Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
