import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useDashboardData(orgId?: string) {
    return useQuery({
        queryKey: ['dashboard', 'snapshot', orgId],
        queryFn: async () => {
            if (!orgId) return null;

            // [PERFORMANCE] Single Aggregated Call (Reduced from 7 requests)
            const snapshot = await api.analytics.dashboardSnapshot();

            // Map Snapshot to Component Props Structure
            return {
                stats: {
                    totalContracts: snapshot.stats.total || 0,
                    activeContracts: snapshot.stats.active || 0,
                    activeValue: snapshot.stats.value || 0,
                    draftContracts: snapshot.stats.draft || 0,
                    pendingApprovals: snapshot.stats.pending || 0,
                    trend: snapshot.stats.trend,
                },
                recentContracts: snapshot.recent || [],
                expiringContracts: snapshot.attention.expiring || [],
                rejectedContracts: snapshot.attention.rejected || [],

                // Flatten Approvals for Attention Banner
                pendingApprovals: [
                    ...(Array.isArray(snapshot.attention.approvals.legal) ? snapshot.attention.approvals.legal : []),
                    ...(Array.isArray(snapshot.attention.approvals.finance) ? snapshot.attention.approvals.finance : [])
                ].slice(0, 5),

                // Audit logs removed from UI as per optimization plan
                auditLogs: [],
            };
        },
        enabled: !!orgId,
        staleTime: 60000, // 1 minute cache
        refetchOnWindowFocus: false, // Prevent aggressive refetching
    });
}
