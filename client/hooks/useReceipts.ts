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
    mutationFn: async (receiptData: Partial<Receipt>) => {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create receipt');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete receipt');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });

  const createReturnMutation = useMutation({
    mutationFn: async ({ receiptId, returnData }: { receiptId: string; returnData: any }) => {
      const response = await fetch(`/api/supplier-returns/from-receipt/${receiptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      });
      if (!response.ok) throw new Error('Failed to create return');
      return response.json();
    },
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
