import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contract } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta shartnomani yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useContractDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<Contract>({
    queryKey: ['contract', id],
    queryFn: () => api.get<Contract>(`/api/contracts/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (contractData: any) =>
      isNew
        ? api.post<Contract>('/api/contracts', contractData)
        : api.put<Contract>(`/api/contracts/${id}`, contractData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/contracts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  return {
    contract: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    deleteContract: deleteMutation.mutateAsync,
  };
};
