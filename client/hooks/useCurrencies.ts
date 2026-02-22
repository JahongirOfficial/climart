import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Currency } from '@shared/api';
import { api } from '@/lib/api';

export const useCurrencies = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Currency[]>({
    queryKey: ['currencies'],
    queryFn: () => api.get<Currency[]>('/api/currencies'),
    staleTime: 1000 * 60 * 60, // 1 soat cache
  });

  const syncCbuMutation = useMutation({
    mutationFn: () => api.post<{ updatedCount: number }>('/api/currencies/sync-cbu', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currencies'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Currency> }) =>
      api.put<Currency>(`/api/currencies/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currencies'] }),
  });

  const setRateMutation = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) =>
      api.patch<Currency>(`/api/currencies/${id}/rate`, { rate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currencies'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { code: string; name: string; symbol: string; nominal?: number; exchangeRate: number }) =>
      api.post<Currency>('/api/currencies', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currencies'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/api/currencies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currencies'] }),
  });

  const getRate = (code: string): number => {
    const currency = (data || []).find(c => c.code === code);
    return currency?.exchangeRate || 1;
  };

  return {
    currencies: data || [],
    loading: isLoading,
    getRate,
    syncCbu: syncCbuMutation.mutateAsync,
    syncing: syncCbuMutation.isPending,
    syncResult: syncCbuMutation.data,
    update: (id: string, d: Partial<Currency>) => updateMutation.mutateAsync({ id, data: d }),
    updating: updateMutation.isPending,
    setRate: (id: string, rate: number) => setRateMutation.mutateAsync({ id, rate }),
    settingRate: setRateMutation.isPending,
    create: createMutation.mutateAsync,
    creating: createMutation.isPending,
    remove: deleteMutation.mutateAsync,
    removing: deleteMutation.isPending,
  };
};
