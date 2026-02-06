'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, currentOrg } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
        if (!isLoading && isAuthenticated && !currentOrg) {
            router.replace('/select-org');
        }
    }, [isLoading, isAuthenticated, currentOrg, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="animate-pulse text-neutral-400">Loading…</div>
            </div>
        );
    }

    if (!isAuthenticated || !currentOrg) {
        return null;
    }

    // Sidebar + header shell will be built in Phase 1.4
    return (
        <div className="min-h-screen bg-neutral-50">
            {children}
        </div>
    );
}
