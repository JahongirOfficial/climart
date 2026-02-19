import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { PartnerWithStats } from '@shared/api';
import { api } from '@/lib/api';

export const usePartners = (type?: 'customer' | 'supplier' | 'both' | 'worker') => {
  const queryClient = useQueryClient();

  const { data: partners = [], isLoading: loading, error, refetch } = useQuery<PartnerWithStats[]>({
    queryKey: ['partners', type],
    queryFn: () => api.get<PartnerWithStats[]>(type ? `/api/partners?type=${type}` : '/api/partners'),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  return {
    partners,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    deletePartner: deleteMutation.mutateAsync,
  };
};
