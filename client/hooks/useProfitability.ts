import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

interface ProfitabilityData {
  summary: {
    sales: {
      revenue: number;
      cost: number;
      profit: number;
      quantity: number;
      count: number;
    };
    returns: {
      revenue: number;
      cost: number;
      loss: number;
      quantity: number;
      count: number;
    };
    net: {
      revenue: number;
      cost: number;
      profit: number;
      profitMargin: number;
    };
  };
  groupedData: Array<{
    name: string;
    salesQuantity: number;
    salesRevenue: number;
    salesCost: number;
    salesProfit: number;
    salesCount?: number;
    returnQuantity: number;
    returnRevenue: number;
    returnCost: number;
    returnLoss: number;
    returnCount?: number;
    netRevenue: number;
    netCost: number;
    netProfit: number;
    profitMargin: number;
  }>;
  groupBy: string;
}

export const useProfitability = (startDate?: string, endDate?: string, groupBy: string = 'products') => {
  const { data, isLoading: loading, error, refetch } = useQuery<ProfitabilityData>({
    queryKey: ['profitability', startDate, endDate, groupBy],
    queryFn: () => api.get<ProfitabilityData>(`/api/profitability${buildQueryString({ startDate, endDate, groupBy })}`),
    placeholderData: keepPreviousData,
  });

  return {
    data,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
