import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

interface CustomerDebt {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  totalSales: number;
  totalPaid: number;
  totalReturns: number;
  totalPayments: number;
  debt: number;
  overdueAmount: number;
  lastOperationDate: string | null;
  shipmentsCount: number;
  returnsCount: number;
  paymentsCount: number;
  transactions: Array<{
    type: string;
    date: string;
    number: string;
    amount: number;
    paid: number;
    balance: number;
  }>;
}

interface DebtsData {
  summary: {
    totalCustomers: number;
    totalDebt: number;
    totalOverdue: number;
    totalSales: number;
    totalPaid: number;
    customersWithDebt: number;
    customersWithOverdue: number;
  };
  debts: CustomerDebt[];
}

export const useCustomerDebts = (startDate?: string, endDate?: string, customerId?: string) => {
  const { data, isLoading: loading, error, refetch } = useQuery<DebtsData>({
    queryKey: ['customer-debts', startDate, endDate, customerId],
    queryFn: () => api.get<DebtsData>(`/api/customer-debts${buildQueryString({ startDate, endDate, customerId })}`),
    placeholderData: keepPreviousData,
  });

  return {
    data,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};

export const useReconciliationReport = (customerId: string, startDate?: string, endDate?: string) => {
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['reconciliation', customerId, startDate, endDate],
    queryFn: () => api.get(`/api/customer-debts/${customerId}/reconciliation${buildQueryString({ startDate, endDate })}`),
    enabled: !!customerId,
    placeholderData: keepPreviousData,
  });

  return {
    data,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
