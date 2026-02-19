import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Supplier } from '@shared/api';
import { api } from '@/lib/api';

export const useSuppliers = () => {
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading: loading, error, refetch } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => api.get<Supplier[]>('/api/partners?type=supplier'),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Supplier>) => api.post<Supplier>('/api/partners', { ...data, type: 'supplier' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      api.put<Supplier>(`/api/partners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  return {
    suppliers,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: (id: string, data: Partial<Supplier>) => updateMutation.mutateAsync({ id, data }),
    deleteSupplier: deleteMutation.mutateAsync,
  };
};
