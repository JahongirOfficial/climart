import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerOrder } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta buyurtmani yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useCustomerOrder = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<CustomerOrder>({
    queryKey: ['customer-order', id],
    queryFn: () => api.get<CustomerOrder>(`/api/customer-orders/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (orderData: any) =>
      isNew
        ? api.post<any>('/api/customer-orders', orderData)
        : api.put<CustomerOrder>(`/api/customer-orders/${id}`, orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/customer-orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/customer-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });

  const reserveMutation = useMutation({
    mutationFn: () => api.patch<{ warnings?: string[] }>(`/api/customer-orders/${id}/reserve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const unreserveMutation = useMutation({
    mutationFn: () => api.patch(`/api/customer-orders/${id}/unreserve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
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
    reserve: reserveMutation.mutateAsync,
    unreserve: unreserveMutation.mutateAsync,
  };
};
