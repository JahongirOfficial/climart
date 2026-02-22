import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerReturn } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta qaytarishni yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useCustomerReturn = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<CustomerReturn>({
    queryKey: ['customer-return', id],
    queryFn: () => api.get<CustomerReturn>(`/api/customer-returns/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (returnData: any) =>
      isNew
        ? api.post<any>('/api/customer-returns', returnData)
        : api.put<CustomerReturn>(`/api/customer-returns/${id}`, returnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
      queryClient.invalidateQueries({ queryKey: ['customer-return', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/customer-returns/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
      queryClient.invalidateQueries({ queryKey: ['customer-return', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/customer-returns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
    },
  });

  return {
    customerReturn: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    updateStatus: statusMutation.mutateAsync,
    deleteReturn: deleteMutation.mutateAsync,
  };
};
