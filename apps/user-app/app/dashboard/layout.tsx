'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { MobileHeader } from '@/components/mobile-header';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const { currentOrg, isLoading, isAuthenticated } = useAuth();

    // Redirect if not authenticated or no org selected
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (!currentOrg) {
                router.push('/select-org');
            }
        }
    }, [isLoading, isAuthenticated, currentOrg, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFDFF]">
                <Spinner size="lg" color="orange" />
            </div>
        );
    }

    if (!isAuthenticated || !currentOrg) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex flex-col selection:bg-orange-100 selection:text-orange-900">
            {/* Desktop Header */}
            <div className="hidden lg:block">
                <DashboardHeader />
            </div>

            {/* Mobile Header (includes Sidebar trigger) */}
            <div className="lg:hidden">
                <MobileHeader />
            </div>

            <div className="flex flex-1 max-w-[1920px] mx-auto w-full relative">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block">
                    <DashboardSidebar />
                </div>

                <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] scroll-smooth pb-20 lg:pb-12">
                    <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
