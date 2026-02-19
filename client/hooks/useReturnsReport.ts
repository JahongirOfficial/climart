import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

interface ReturnsReportData {
  summary: {
    totalReturns: number;
    totalValue: number;
    averageReturnValue: number;
  };
  byReason: Record<string, { count: number; value: number }>;
  topReturnedProducts: Array<{
    productName: string;
    quantity: number;
    value: number;
  }>;
  topReturningCustomers: Array<{
    customerName: string;
    returns: number;
    value: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    value: number;
  }>;
  returns: any[];
}

export const useReturnsReport = (startDate?: string, endDate?: string) => {
  const { data, isLoading: loading, error, refetch } = useQuery<ReturnsReportData>({
    queryKey: ['returns-report', startDate, endDate],
    queryFn: () => api.get<ReturnsReportData>(`/api/returns-report${buildQueryString({ startDate, endDate })}`),
    placeholderData: keepPreviousData,
  });

  return {
    data,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
