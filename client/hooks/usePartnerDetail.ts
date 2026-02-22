import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Partner } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta kontragentni yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const usePartnerDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  // GET /api/partners/:id returns { partner, transactions }
  const { data, isLoading: loading, error, refetch } = useQuery<{ partner: Partner; transactions: any }>({
    queryKey: ['partner', id],
    queryFn: () => api.get<{ partner: Partner; transactions: any }>(`/api/partners/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (partnerData: any) =>
      isNew
        ? api.post<Partner>('/api/partners', partnerData)
        : api.put<Partner>(`/api/partners/${id}`, partnerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  return {
    partner: data?.partner || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    deletePartner: deleteMutation.mutateAsync,
  };
};
