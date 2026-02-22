import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface WarehouseExpense {
  _id: string;
  warehouse: string;
  warehouseName: string;
  expenseDate: string;
  category: 'rent' | 'utilities' | 'maintenance' | 'salaries' | 'equipment' | 'other';
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseSummary {
  totalAmount: number;
  byCategory: {
    category: string;
    total: number;
  }[];
}

export const useWarehouseExpense = () => {
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading: loading, error, refetch } = useQuery<WarehouseExpense[]>({
    queryKey: ['warehouse-expense'],
    queryFn: async () => {
      return api.get<WarehouseExpense[]>('/api/warehouse-expense');
    },
    placeholderData: keepPreviousData,
  });

  const { data: summary } = useQuery<ExpenseSummary>({
    queryKey: ['warehouse-expense-summary'],
    queryFn: async () => {
      return api.get<ExpenseSummary>('/api/warehouse-expense/summary');
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<WarehouseExpense>) => {
      return api.post('/api/warehouse-expense', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-expense'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-expense-summary'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/warehouse-expense/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-expense'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-expense-summary'] });
    },
  });

  return {
    expenses,
    summary,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createExpense: createMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync,
  };
};
