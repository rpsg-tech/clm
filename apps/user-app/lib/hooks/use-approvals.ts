import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useApprovals(type: 'LEGAL' | 'FINANCE') {
    return useQuery({
        queryKey: ['approvals', type],
        queryFn: () => api.approvals.pending(type),
        staleTime: 15000,
        enabled: !!type,
    });
}
