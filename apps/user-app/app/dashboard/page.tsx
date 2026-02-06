'use client';

import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
    const { user, role } = useAuth();

    // Role-specific dashboards will be built in Phase 2.1
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold text-neutral-900">
                Welcome{user?.name ? `, ${user.name}` : ''}
            </h1>
            <p className="mt-1 text-neutral-600">
                {role ? `Role: ${role}` : 'Dashboard'}
            </p>
        </div>
    );
}
