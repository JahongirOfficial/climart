import { useQuery } from '@tanstack/react-query';

export interface TurnoverItem {
    _id: string;
    name: string;
    sku?: string;
    category?: string;
    unit?: string;
    costPrice: number;
    openingQty: number;
    openingAmount: number;
    incomingQty: number;
    incomingAmount: number;
    outgoingQty: number;
    outgoingAmount: number;
    closingQty: number;
    closingAmount: number;
    hasMovement: boolean;
}

export interface TurnoverTotals {
    openingQty: number;
    openingAmount: number;
    incomingQty: number;
    incomingAmount: number;
    outgoingQty: number;
    outgoingAmount: number;
    closingQty: number;
    closingAmount: number;
}

export interface TurnoverData {
    items: TurnoverItem[];
    totals: TurnoverTotals;
    period: { startDate: string; endDate: string };
}

export const useTurnover = (filters: {
    startDate: string;
    endDate: string;
    warehouse?: string;
    category?: string;
    showInactive?: boolean
}) => {
    const { data, isLoading: loading, error, refetch } = useQuery<TurnoverData>({
        queryKey: ['turnover', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('startDate', filters.startDate);
            params.append('endDate', filters.endDate);
            if (filters.warehouse) params.append('warehouse', filters.warehouse);
            if (filters.category && filters.category !== 'all') params.append('category', filters.category);
            if (filters.showInactive) params.append('showInactive', 'true');

            const response = await fetch(`/api/turnover?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch turnover');
            return response.json();
        },
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });

    return {
        items: data?.items || [],
        totals: data?.totals || null,
        loading,
        error: error instanceof Error ? error.message : null,
        refetch,
    };
};
