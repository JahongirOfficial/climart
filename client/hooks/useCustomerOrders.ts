import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { CustomerOrder } from '@shared/api';
import { api } from '@/lib/api';

export const useCustomerOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: loading, error, refetch } = useQuery<CustomerOrder[]>({
    queryKey: ['customer-orders'],
    queryFn: () => api.get<CustomerOrder[]>('/api/customer-orders'),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (orderData: Partial<CustomerOrder>) => api.post<any>('/api/customer-orders', orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerOrder> }) =>
      api.put<CustomerOrder>(`/api/customer-orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/customer-orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/customer-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });

  return {
    orders,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createOrder: createMutation.mutateAsync,
    updateOrder: (id: string, data: Partial<CustomerOrder>) => updateMutation.mutateAsync({ id, data }),
    updateStatus: (id: string, status: string) => statusMutation.mutateAsync({ id, status }),
    deleteOrder: deleteMutation.mutateAsync,
  };
};
