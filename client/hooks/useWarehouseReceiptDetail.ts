import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WarehouseReceipt } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta ombor kirim hujjatini yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useWarehouseReceiptDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<WarehouseReceipt>({
    queryKey: ['warehouse-receipt', id],
    queryFn: () => api.get<WarehouseReceipt>(`/api/warehouse-receipts/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (receiptData: any) =>
      isNew
        ? api.post<any>('/api/warehouse-receipts', receiptData)
        : api.put<WarehouseReceipt>(`/api/warehouse-receipts/${id}`, receiptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-receipt', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/warehouse-receipts/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-receipt', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/warehouse-receipts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    receipt: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    confirm: confirmMutation.mutateAsync,
    deleteReceipt: deleteMutation.mutateAsync,
  };
};
