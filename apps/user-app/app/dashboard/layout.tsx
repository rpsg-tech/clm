'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { SidebarProvider } from '@/lib/sidebar-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { OracleAssistant } from '@/components/oracle-assistant';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const { currentOrg, isLoading, isAuthenticated } = useAuth();
    const [mounted, setMounted] = useState(false);

    // Set mounted on client
    useEffect(() => {
        setMounted(true);
    }, []);

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

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted || isLoading) {
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
        <SidebarProvider>
            <div className="h-screen bg-[#FDFDFF] flex flex-col lg:flex-row overflow-hidden selection:bg-orange-100 selection:text-orange-900">
                {/* Mobile Header */}
                <div className="lg:hidden sticky top-0 z-50">
                    <MobileHeader />
                </div>

                {/* Desktop Sidebar (Fixed Left) */}
                <div className="hidden lg:block shrink-0">
                    <DashboardSidebar />
                </div>

                {/* Main Content Area (Right Side) */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative">
                    {/* Desktop Header */}
                    <div className="hidden lg:block shrink-0 z-40">
                        <DashboardHeader />
                    </div>

                    <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
                        <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {children}
                        </div>
                    </main>
                    {/* AI Assistant */}
                    <OracleAssistant />
                </div>
            </div>
        </SidebarProvider>
    );
}
