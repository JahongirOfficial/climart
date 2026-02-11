import { useQuery } from '@tanstack/react-query';

export interface BalanceItem {
    _id: string;
    name: string;
    sku?: string;
    category?: string;
    unit?: string;
    quantity: number;
    reserved: number;
    available: number;
    minStock: number;
    isLowStock: boolean;
    costPrice: number;
    sellingPrice: number;
    costValue: number;
    sellingValue: number;
    potentialProfit: number;
}

export interface BalanceTotals {
    totalQuantity: number;
    totalReserved: number;
    totalAvailable: number;
    totalCostValue: number;
    totalSellingValue: number;
    totalPotentialProfit: number;
    lowStockCount: number;
    negativeStockCount: number;
}

export interface BalanceData {
    items: BalanceItem[];
    totals: BalanceTotals;
}

export const useBalance = (filters: { category?: string; hideZero?: boolean }) => {
    const { data, isLoading: loading, error, refetch } = useQuery<BalanceData>({
        queryKey: ['balance', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.category && filters.category !== 'all') params.append('category', filters.category);
            if (filters.hideZero) params.append('hideZero', 'true');

            const response = await fetch(`/api/balance?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch balance');
            return response.json();
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    return {
        items: data?.items || [],
        totals: data?.totals || null,
        loading,
        error: error instanceof Error ? error.message : null,
        refetch,
    };
};
