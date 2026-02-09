'use client';

import { useAuth } from '@/lib/auth-context';
import { RoleCode } from '@repo/types';
import { BusinessDashboard } from '@/components/dashboard/business-dashboard';
import { LegalDashboard } from '@/components/dashboard/legal-dashboard';
import { LegalHeadDashboard } from '@/components/dashboard/legal-head-dashboard';
import { FinanceDashboard } from '@/components/dashboard/finance-dashboard';
import { SuperAdminDashboard } from '@/components/dashboard/super-admin-dashboard';

const LEGAL_ROLES: string[] = [RoleCode.LEGAL_MANAGER, RoleCode.ENTITY_ADMIN];
const FINANCE_ROLES: string[] = [RoleCode.FINANCE_MANAGER];

export default function DashboardPage() {
    const { role } = useAuth();

    if (role === RoleCode.SUPER_ADMIN) {
        return <SuperAdminDashboard />;
    }

    if (role === RoleCode.LEGAL_HEAD) {
        return <LegalHeadDashboard />;
    }

    if (role && FINANCE_ROLES.includes(role)) {
        return <FinanceDashboard />;
    }

    if (role && LEGAL_ROLES.includes(role)) {
        return <LegalDashboard />;
    }

    return <BusinessDashboard />;
}
