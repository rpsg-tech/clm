import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Contract, AuditLog, PaginatedResponse } from '@repo/types';

interface DashboardSummary {
    total: number;
    active: number;
    activeValue: number;
    draft: number;
    byStatus?: Record<string, number>;
}

interface AuditLogsResponse {
    logs: AuditLog[];
    total: number;
}

export function useDashboardData(orgId?: string) {
    return useQuery({
        queryKey: ['dashboard', orgId],
        queryFn: async () => {
            if (!orgId) return null;

            const emptyPage: PaginatedResponse<Contract> = {
                data: [],
                meta: { total: 0, page: 1, limit: 5, totalPages: 1 },
            };

            const [summary, contracts, expiring, approvalsLegal, approvalsFinance, logs, rejected] = await Promise.all([
                api.analytics.contractsSummary().catch(() => ({ total: 0, byStatus: {} })),
                api.contracts.list({ limit: 5 }).catch(() => emptyPage),
                api.contracts.list({ limit: 5, expiringDays: 30 }).catch(() => emptyPage),
                api.approvals.pending('LEGAL').catch(() => []),
                api.approvals.pending('FINANCE').catch(() => []),
                api.audit.getLogs({ take: 5 }).catch(() => ({ logs: [], total: 0 })),
                api.contracts.list({ status: 'REJECTED', limit: 5 }).catch(() => emptyPage),
            ]);

            const summaryData = summary as DashboardSummary;
            const contractsData = contracts as PaginatedResponse<Contract>;
            const expiringData = expiring as PaginatedResponse<Contract>;
            const rejectedData = rejected as PaginatedResponse<Contract>;
            const logsData = logs as AuditLogsResponse;

            return {
                stats: {
                    totalContracts: summaryData.total || 0,
                    activeContracts: summaryData.active || 0,
                    activeValue: summaryData.activeValue || 0,
                    draftContracts: summaryData.draft || 0,
                    pendingApprovals: (Array.isArray(approvalsLegal) ? approvalsLegal.length : 0) +
                        (Array.isArray(approvalsFinance) ? approvalsFinance.length : 0),
                },
                recentContracts: (contractsData.data || []).slice(0, 5),
                expiringContracts: (expiringData.data || []).slice(0, 5),
                rejectedContracts: (rejectedData.data || []).slice(0, 5),
                pendingApprovals: [
                    ...(Array.isArray(approvalsLegal) ? approvalsLegal : []),
                    ...(Array.isArray(approvalsFinance) ? approvalsFinance : [])
                ].slice(0, 5),
                auditLogs: logsData.logs || [],
            };
        },
        enabled: !!orgId,
        staleTime: 30000, // 30 seconds
    });
}
