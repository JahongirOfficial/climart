import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

export interface FunnelStage {
  status: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
  avgDays: number;
  conversion: number;
  percentage: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalAmount: number;
  deliveredCount: number;
  cancelledCount: number;
  conversionRate: number;
}

export interface SalesFunnelData {
  funnel: FunnelStage[];
  totalOrders: number;
  totalAmount: number;
  topCustomers: TopCustomer[];
}

export interface SalesFunnelFilters {
  startDate?: string;
  endDate?: string;
}

export const useSalesFunnel = (filters: SalesFunnelFilters = {}) => {
  const queryString = buildQueryString({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const { data, isLoading: loading, error, refetch } = useQuery<SalesFunnelData>({
    queryKey: ['sales-funnel', filters],
    queryFn: () => api.get<SalesFunnelData>(`/api/sales-funnel${queryString}`),
  });

  return {
    data: data || { funnel: [], totalOrders: 0, totalAmount: 0, topCustomers: [] },
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
