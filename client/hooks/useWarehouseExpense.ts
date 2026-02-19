import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

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
      const response = await fetch('/api/warehouse-expense');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  const { data: summary } = useQuery<ExpenseSummary>({
    queryKey: ['warehouse-expense-summary'],
    queryFn: async () => {
      const response = await fetch('/api/warehouse-expense/summary');
      if (!response.ok) throw new Error('Failed to fetch summary');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<WarehouseExpense>) => {
      const response = await fetch('/api/warehouse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create expense');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-expense'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-expense-summary'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/warehouse-expense/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete expense');
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
