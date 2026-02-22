import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

export interface ProductEconomics {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  avgSellingPrice: number;
  avgCostPrice: number;
  invoiceCount: number;
  breakEven: number;
  hasPendingCosts: boolean;
}

export interface UnitEconomicsSummary {
  totalProducts: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  overallMargin: number;
}

export interface UnitEconomicsData {
  products: ProductEconomics[];
  summary: UnitEconomicsSummary;
}

export interface UnitEconomicsFilters {
  startDate?: string;
  endDate?: string;
}

export const useUnitEconomics = (filters: UnitEconomicsFilters = {}) => {
  const queryString = buildQueryString({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const { data, isLoading: loading, error, refetch } = useQuery<UnitEconomicsData>({
    queryKey: ['unit-economics', filters],
    queryFn: () => api.get<UnitEconomicsData>(`/api/unit-economics${queryString}`),
  });

  return {
    data: data || { products: [], summary: { totalProducts: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0, overallMargin: 0 } },
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
