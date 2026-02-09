import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface UseContractsParams {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export function useContracts(params: UseContractsParams = {}) {
    const { status, search, page = 1, limit = 20 } = params;

    return useQuery({
        queryKey: ['contracts', { status, search, page, limit }],
        queryFn: () =>
            api.contracts.list({
                status: status || undefined,
                search: search || undefined,
                page,
                limit,
            }),
        staleTime: 30000,
    });
}
