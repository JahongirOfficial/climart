import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WarehouseExpenseDoc } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta ombor xarajatini yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useWarehouseExpenseDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<WarehouseExpenseDoc>({
    queryKey: ['warehouse-expense', id],
    queryFn: () => api.get<WarehouseExpenseDoc>(`/api/warehouse-expense/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (expenseData: any) =>
      api.post<any>('/api/warehouse-expense', expenseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-expense', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/warehouse-expense/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-expenses'] });
    },
  });

  return {
    expense: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    deleteExpense: deleteMutation.mutateAsync,
  };
};
