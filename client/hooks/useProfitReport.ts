import { useQuery } from '@tanstack/react-query';
import { ProfitReportResponse } from '@shared/api';
import { api } from '@/lib/api';

interface UseProfitReportParams {
  startDate: string;
  endDate: string;
  customerId?: string;
  productId?: string;
}

export const useProfitReport = (params: UseProfitReportParams) => {
  const { data, isLoading: loading, error, refetch } = useQuery<ProfitReportResponse>({
    queryKey: ['profit-report', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
      });

      if (params.customerId) searchParams.append('customerId', params.customerId);
      if (params.productId) searchParams.append('productId', params.productId);

      return api.get<ProfitReportResponse>(`/api/reports/profit?${searchParams.toString()}`);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!params.startDate && !!params.endDate, // Only fetch if dates are provided
  });

  return {
    data: data || {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      confirmedProfit: 0,
      estimatedProfit: 0,
      hasPendingCosts: false,
      invoices: [],
    },
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
