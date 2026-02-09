'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@repo/ui';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
