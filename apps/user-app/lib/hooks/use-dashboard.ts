import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useDashboardData(orgId?: string) {
    return useQuery({
        queryKey: ['dashboard', orgId],
        queryFn: async () => {
            if (!orgId) return null;

            const [summary, contracts, expiring, approvalsLegal, approvalsFinance, logs] = await Promise.all([
                api.analytics.contractsSummary().catch(() => ({ total: 0, byStatus: {} })),
                api.contracts.list({ limit: 5 }).catch(() => ({ data: [], meta: { total: 0 } })),
                api.contracts.list({ limit: 5, expiringDays: 30 }).catch(() => ({ data: [], meta: { total: 0 } })),
                api.approvals.pending('LEGAL').catch(() => []),
                api.approvals.pending('FINANCE').catch(() => []),
                api.audit.getLogs({ take: 5 }).catch(() => ({ logs: [], total: 0 })),
            ]);

            return {
                stats: {
                    totalContracts: (summary as any).total || 0,
                    activeContracts: (summary as any).active || 0,
                    draftContracts: (summary as any).draft || 0,
                    pendingApprovals: (Array.isArray(approvalsLegal) ? approvalsLegal.length : 0) +
                        (Array.isArray(approvalsFinance) ? approvalsFinance.length : 0),
                },
                recentContracts: ((contracts as any).data || []).slice(0, 5),
                expiringContracts: ((expiring as any).data || []).slice(0, 5),
                pendingApprovals: [
                    ...(Array.isArray(approvalsLegal) ? approvalsLegal : []),
                    ...(Array.isArray(approvalsFinance) ? approvalsFinance : [])
                ].slice(0, 5),
                auditLogs: (logs as any).logs || [],
            };
        },
        enabled: !!orgId,
        staleTime: 30000, // 30 seconds
    });
}
