'use client';

import { useAuth } from '@/lib/auth-context';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { role } = useAuth();

    // Role guard — only admin roles can access
    const adminRoles = ['SUPER_ADMIN', 'ENTITY_ADMIN', 'LEGAL_HEAD'];
    if (!adminRoles.includes(role ?? '')) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <MaterialIcon name="lock" size={32} className="text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 mb-1">Access Denied</h2>
                <p className="text-sm text-neutral-500 max-w-sm">
                    You don&apos;t have permission to access admin pages.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
