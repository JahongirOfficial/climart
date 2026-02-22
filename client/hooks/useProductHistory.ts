import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useProductHistory = (productId: string | null) => {
    const { data: history = [], isLoading: loading, error, refetch } = useQuery<any[]>({
        queryKey: ['product-history', productId],
        queryFn: async () => {
            if (!productId) return [];
            return api.get<any[]>(`/api/products/${productId}/history`);
        },
        enabled: !!productId,
        staleTime: 1000 * 60 * 2, // 2 minutes cache for history
    });

    return {
        history,
        loading,
        error: error instanceof Error ? error.message : null,
        refetch
    };
};
