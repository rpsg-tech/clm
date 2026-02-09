import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface UseTemplatesParams {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export function useTemplates(params: UseTemplatesParams = {}) {
    const { category, search, page = 1, limit = 50 } = params;

    return useQuery({
        queryKey: ['templates', { category, search, page, limit }],
        queryFn: () =>
            api.templates.list({
                category: category || undefined,
                search: search || undefined,
                page,
                limit,
            }),
        staleTime: 60000,
    });
}
