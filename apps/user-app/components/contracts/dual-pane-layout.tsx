'use client';

interface DualPaneLayoutProps {
    left: React.ReactNode;
    right: React.ReactNode;
    leftWidth?: string;
    rightWidth?: string;
    className?: string;
}

export function DualPaneLayout({
    left,
    right,
    leftWidth = 'w-1/2',
    rightWidth = 'w-1/2',
    className = '',
}: DualPaneLayoutProps) {
    return (
        <div className={`flex gap-6 h-full ${className}`}>
            <div className={`${leftWidth} overflow-y-auto flex-shrink-0`}>{left}</div>
            <div className={`${rightWidth} overflow-y-auto flex-shrink-0`}>{right}</div>
        </div>
    );
}
