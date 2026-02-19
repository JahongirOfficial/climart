import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { WarehouseReceipt } from '@shared/api';
import { api, apiFetch } from '@/lib/api';

export const useWarehouseReceipts = (warehouseId?: string) => {
  const queryClient = useQueryClient();

  const { data: receipts = [], isLoading: loading, error, refetch } = useQuery<WarehouseReceipt[]>({
    queryKey: ['warehouse-receipts', warehouseId],
    queryFn: () => api.get<WarehouseReceipt[]>(warehouseId ? `/api/warehouse-receipts?warehouse=${warehouseId}` : '/api/warehouse-receipts'),
    placeholderData: keepPreviousData,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/warehouse-receipts/${id}/confirm`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/warehouse-receipts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] });
    },
  });

  return {
    receipts,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    confirmReceipt: confirmMutation.mutateAsync,
    deleteReceipt: deleteMutation.mutateAsync,
  };
};
