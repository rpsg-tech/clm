'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { AdminHeader } from '@/components/admin-header';
import { AdminSidebar } from '@/components/admin-sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50/50">
                <Spinner size="lg" color="orange" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex flex-col selection:bg-orange-100 selection:text-orange-900">
            <AdminHeader />
            <div className="flex flex-1 max-w-[1920px] mx-auto w-full relative">
                <AdminSidebar />
                <main className="flex-1 p-8 lg:p-12 overflow-y-auto h-[calc(100vh-64px)] scroll-smooth">
                    <div className="max-w-[1100px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
