import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useContractVersions(contractId: string) {
    return useQuery({
        queryKey: ['contract-versions', contractId],
        queryFn: () => api.contracts.getVersions(contractId),
        staleTime: 30000,
        enabled: !!contractId,
    });
}
