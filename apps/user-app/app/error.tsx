'use client';

import { Button } from '@repo/ui';

export default function Error({
    error: _error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
            <div className="max-w-md w-full text-center space-y-4">
                <h2 className="text-2xl font-semibold text-neutral-900">Something went wrong</h2>
                <p className="text-neutral-600">
                    An unexpected error occurred. Please try again.
                </p>
                <Button onClick={reset}>Try Again</Button>
            </div>
        </div>
    );
}
