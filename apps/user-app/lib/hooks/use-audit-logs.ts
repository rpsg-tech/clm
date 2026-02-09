import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useAuditLogs(contractId: string) {
    return useQuery({
        queryKey: ['audit-logs', contractId],
        queryFn: () => api.contracts.getAuditLogs(contractId),
        staleTime: 30000,
        enabled: !!contractId,
    });
}
