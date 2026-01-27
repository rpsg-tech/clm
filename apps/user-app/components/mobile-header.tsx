'use client';

import { Menu } from 'lucide-react';
import { Button } from '@repo/ui';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@repo/ui';
import { DashboardSidebar } from './dashboard-sidebar';
// We need to import tokens or use classes for logo styling if needed, but sidebar has its own logo usually.
// Actually DashboardSidebar doesn't have a logo in the code I saw, it just has "Menu".
// DashboardHeader likely has the logo.
import { DashboardHeader } from './dashboard-header';

export function MobileHeader() {
    return (
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-neutral-200 sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="inline-flex items-center justify-center rounded-lg w-10 h-10 text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-200">
                            <Menu className="w-5 h-5" />
                            <span className="sr-only">Toggle menu</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[300px]">
                        {/* Override sticky and height for mobile drawer context */}
                        <DashboardSidebar className="w-full border-none h-full min-h-0 bg-white static top-0 p-4 shadow-none" />
                        <div className="sr-only">
                            <SheetTitle>Mobile Menu</SheetTitle>
                            <SheetDescription>
                                Navigation menu for accessing dashboard, contracts, and settings.
                            </SheetDescription>
                        </div>
                    </SheetContent>
                </Sheet>
                <span className="font-bold text-lg tracking-tight">CLM Enterprise</span>
            </div>

            {/* We might want some header actions here too, like UserProfile, but DashboardHeader handles desktop. 
                Maybe we reuse DashboardHeader's content or just hide it on mobile? 
                The current Dashboard layout has DashboardHeader at the top. 
            */}
        </div>
    );
}
