import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta kirim hujjatini yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useReceipt = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<Receipt>({
    queryKey: ['receipt', id],
    queryFn: () => api.get<Receipt>(`/api/receipts/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (receiptData: any) =>
      api.post<any>('/api/receipts', receiptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/receipts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const createReturnMutation = useMutation({
    mutationFn: (returnData: any) =>
      api.post(`/api/supplier-returns/from-receipt/${id}`, returnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-returns'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
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
    deleteReceipt: deleteMutation.mutateAsync,
    createReturn: createReturnMutation.mutateAsync,
  };
};
