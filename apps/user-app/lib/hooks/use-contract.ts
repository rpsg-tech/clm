import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useContract(id: string) {
    return useQuery({
        queryKey: ['contract', id],
        queryFn: () => api.contracts.get(id),
        staleTime: 30000,
        enabled: !!id,
    });
}
