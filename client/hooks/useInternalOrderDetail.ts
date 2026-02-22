import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InternalOrder } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta ichki buyurtmani yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useInternalOrderDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<InternalOrder>({
    queryKey: ['internal-order', id],
    queryFn: () => api.get<InternalOrder>(`/api/internal-orders/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (orderData: any) =>
      api.post<any>('/api/internal-orders', orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-orders'] });
      queryClient.invalidateQueries({ queryKey: ['internal-order', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      api.patch<InternalOrder>(`/api/internal-orders/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-orders'] });
      queryClient.invalidateQueries({ queryKey: ['internal-order', id] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/internal-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-orders'] });
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
    approve: approveMutation.mutateAsync,
    deleteOrder: deleteMutation.mutateAsync,
  };
};
