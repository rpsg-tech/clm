'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Find a way to log this error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
            <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-red-100">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>

            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight mb-2">Something went wrong</h1>
            <p className="text-neutral-500 max-w-md mb-8">
                We encountered an unexpected error while processing your request. Please try again.
            </p>

            <button
                onClick={reset}
                className="inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-neutral-200 bg-white shadow-sm hover:bg-neutral-100 h-9 px-4 py-2 pl-4 pr-5 text-neutral-900"
            >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Try Again
            </button>
        </div>
    );
}
