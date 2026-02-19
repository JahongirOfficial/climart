import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Contract } from '@shared/api';
import { api, apiFetch } from '@/lib/api';

export const useContracts = (partnerId?: string) => {
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading: loading, error, refetch } = useQuery<Contract[]>({
    queryKey: ['contracts', partnerId],
    queryFn: () => api.get<Contract[]>(partnerId ? `/api/contracts?partner=${partnerId}` : '/api/contracts'),
    placeholderData: keepPreviousData,
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/contracts/${id}/set-default`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/contracts/${id}/cancel`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/contracts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  return {
    contracts,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    setAsDefault: setDefaultMutation.mutateAsync,
    cancelContract: cancelMutation.mutateAsync,
    deleteContract: deleteMutation.mutateAsync,
  };
};
