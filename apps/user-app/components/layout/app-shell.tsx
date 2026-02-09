'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@repo/ui';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const isEditorPage = pathname?.includes('/create') || pathname?.includes('/edit');

    // Default to collapsed if on editor page, expanded otherwise
    // We initialize state based on the route to avoid flash of wrong content
    const [sidebarCollapsed, setSidebarCollapsed] = useState(isEditorPage);

    // Sync state if user navigates (e.g. from dashboard -> editor)
    useEffect(() => {
        if (isEditorPage) {
            setSidebarCollapsed(true);
        } else {
            setSidebarCollapsed(false);
        }
    }, [isEditorPage]);

    return (
        <div className="min-h-screen bg-neutral-50">
            <Header />
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((prev) => !prev)}
            />
            <main
                className={cn(
                    'pt-16 transition-all duration-200',
                    sidebarCollapsed ? 'pl-[68px]' : 'pl-64'
                )}
            >
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
}
