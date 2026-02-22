import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Bitta to'lovni yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 *
 * Payment modeli: paymentNumber, type (incoming/outgoing/transfer),
 * paymentDate, amount, partner, partnerName, account (cash/bank),
 * paymentMethod, purpose, status (draft/confirmed/cancelled), notes
 */
export const usePaymentDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<any>({
    queryKey: ['payment', id],
    queryFn: () => api.get<any>(`/api/payments/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (paymentData: any) =>
      isNew
        ? api.post<any>('/api/payments', paymentData)
        : api.put<any>(`/api/payments/${id}`, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.patch(`/api/payments/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/api/payments/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  return {
    payment: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    confirmPayment: confirmMutation.mutateAsync,
    cancelPayment: cancelMutation.mutateAsync,
    deletePayment: deleteMutation.mutateAsync,
  };
};
