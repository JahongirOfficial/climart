import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Service } from '@shared/api';
import { api } from '@/lib/api';

export const useServices = () => {
  const queryClient = useQueryClient();

  const { data: services = [], isLoading: loading, error, refetch } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get<Service[]>('/api/services'),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Service>) => api.post<Service>('/api/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      api.put<Service>(`/api/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  return {
    services,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createService: createMutation.mutateAsync,
    updateService: (id: string, data: Partial<Service>) => updateMutation.mutateAsync({ id, data }),
    deleteService: deleteMutation.mutateAsync,
  };
};
