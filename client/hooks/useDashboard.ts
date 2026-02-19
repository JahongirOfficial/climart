import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type DashboardPeriod = 'today' | 'this_week' | 'this_month' | 'this_year';

interface DashboardStats {
  revenue: {
    current: number;
    change: number;
  };
  profit: {
    current: number;
    change: number;
  };
  averageCheck: {
    current: number;
    change: number;
  };
  debtorDebt: number;
  creditorDebt: number;
  warehouseValue: number;
  lowStockItems: Array<{
    name: string;
    quantity: number;
    minStock: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    sales: number;
  }>;
  topCustomers: Array<{
    name: string;
    orders: number;
    sales: number;
  }>;
  topSuppliers: Array<{
    name: string;
    orders: number;
    sales: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    type: string;
    amount: number;
    status: string;
  }>;
  monthlySales: Array<{
    month: string;
    savdo: number;
  }>;
}

export const useDashboard = (period: DashboardPeriod = 'this_month') => {
  const { data: stats, isLoading, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', period],
    queryFn: () => api.get<DashboardStats>(`/api/dashboard/stats?period=${period}`),
    placeholderData: keepPreviousData,
  });

  return {
    stats,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
