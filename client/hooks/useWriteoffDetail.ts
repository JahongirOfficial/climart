import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Writeoff } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta hisobdan chiqarish hujjatini yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useWriteoffDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<Writeoff>({
    queryKey: ['writeoff', id],
    queryFn: () => api.get<Writeoff>(`/api/writeoffs/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (writeoffData: any) =>
      isNew
        ? api.post<any>('/api/writeoffs', writeoffData)
        : api.put<Writeoff>(`/api/writeoffs/${id}`, writeoffData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
      queryClient.invalidateQueries({ queryKey: ['writeoff', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/writeoffs/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
      queryClient.invalidateQueries({ queryKey: ['writeoff', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/writeoffs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    writeoff: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    confirm: confirmMutation.mutateAsync,
    deleteWriteoff: deleteMutation.mutateAsync,
  };
};
