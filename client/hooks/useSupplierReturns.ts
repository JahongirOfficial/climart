import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { SupplierReturn } from '@shared/api';
import { api } from '@/lib/api';

export const useSupplierReturns = () => {
  const queryClient = useQueryClient();

  const { data: returns = [], isLoading: loading, error, refetch } = useQuery<SupplierReturn[]>({
    queryKey: ['supplier-returns'],
    queryFn: () => api.get<SupplierReturn[]>('/api/supplier-returns'),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<SupplierReturn>) => api.post<SupplierReturn>('/api/supplier-returns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-returns'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/supplier-returns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-returns'] });
    },
  });

  return {
    returns,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createReturn: createMutation.mutateAsync,
    deleteReturn: deleteMutation.mutateAsync,
  };
};
