import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Receipt } from '@shared/api';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

export const useReceipts = (filters?: { startDate?: string; endDate?: string }) => {
  const queryClient = useQueryClient();

  const { data: receipts = [], isLoading: loading, error, refetch } = useQuery<Receipt[]>({
    queryKey: ['receipts', filters],
    queryFn: () => api.get<Receipt[]>(`/api/receipts${buildQueryString({ startDate: filters?.startDate, endDate: filters?.endDate })}`),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (receiptData: Partial<Receipt>) => api.post<Receipt>('/api/receipts', receiptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/receipts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });

  const createReturnMutation = useMutation({
    mutationFn: ({ receiptId, returnData }: { receiptId: string; returnData: any }) =>
      api.post(`/api/supplier-returns/from-receipt/${receiptId}`, returnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });

  return {
    receipts,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createReceipt: createMutation.mutateAsync,
    deleteReceipt: deleteMutation.mutateAsync,
    createReturn: (receiptId: string, returnData: any) => createReturnMutation.mutateAsync({ receiptId, returnData }),
  };
};
