import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PurchaseOrder } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta xarid buyurtmasini yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const usePurchaseOrder = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<PurchaseOrder>({
    queryKey: ['purchase-order', id],
    queryFn: () => api.get<PurchaseOrder>(`/api/purchase-orders/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (orderData: any) =>
      isNew
        ? api.post<any>('/api/purchase-orders', orderData)
        : api.put<PurchaseOrder>(`/api/purchase-orders/${id}`, orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/purchase-orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/purchase-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: () => api.post(`/api/purchase-orders/${id}/receive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    order: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    updateStatus: statusMutation.mutateAsync,
    deleteOrder: deleteMutation.mutateAsync,
    receive: receiveMutation.mutateAsync,
  };
};
