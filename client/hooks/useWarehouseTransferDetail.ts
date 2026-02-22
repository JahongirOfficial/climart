import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WarehouseTransfer } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta ombor ko'chirish hujjatini yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useWarehouseTransferDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<WarehouseTransfer>({
    queryKey: ['warehouse-transfer', id],
    queryFn: () => api.get<WarehouseTransfer>(`/api/warehouse-transfers/${id}`),
    enabled: !isNew,
  });

  // Transfer faqat POST bilan yaratiladi (PUT endpoint yo'q)
  const saveMutation = useMutation({
    mutationFn: (transferData: any) =>
      api.post<any>('/api/warehouse-transfers', transferData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfer', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/warehouse-transfers/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfer', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/warehouse-transfers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    transfer: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    updateStatus: statusMutation.mutateAsync,
    deleteTransfer: deleteMutation.mutateAsync,
  };
};
