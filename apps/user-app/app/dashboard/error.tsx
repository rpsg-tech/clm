'use client';

import { useEffect } from 'react';
import { Button, Card } from '@repo/ui';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service (e.g. Sentry)
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
            <Card className="max-w-md w-full p-8 text-center border-rose-100 bg-rose-50/50">
                <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    Something went wrong
                </h2>
                <p className="text-slate-600 mb-6 text-sm">
                    We encountered an issue loading your dashboard. This might be a temporary glitch.
                </p>
                <div className="flex gap-3 justify-center">
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="bg-white"
                    >
                        Reload Page
                    </Button>
                    <Button
                        onClick={() => reset()}
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 p-2 bg-rose-100 rounded text-xs font-mono text-left overflow-auto max-h-32 text-rose-800">
                        {error.message}
                    </div>
                )}
            </Card>
        </div>
    );
}
