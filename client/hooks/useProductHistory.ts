import { useQuery } from '@tanstack/react-query';

export const useProductHistory = (productId: string | null) => {
    const { data: history = [], isLoading: loading, error, refetch } = useQuery<any[]>({
        queryKey: ['product-history', productId],
        queryFn: async () => {
            if (!productId) return [];
            const response = await fetch(`/api/products/${productId}/history`);
            if (!response.ok) throw new Error('Failed to fetch product history');
            return response.json();
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
