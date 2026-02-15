import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PartnerWithStats } from '@shared/api';

export const usePartners = (type?: 'customer' | 'supplier' | 'both' | 'worker') => {
  const queryClient = useQueryClient();

  const { data: partners = [], isLoading: loading, error, refetch } = useQuery<PartnerWithStats[]>({
    queryKey: ['partners', type],
    queryFn: async () => {
      const url = type ? `/api/partners?type=${type}` : '/api/partners';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch partners');
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    gcTime: 1000 * 60 * 60, // 1 hour garbage collection
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete partner');
    },
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
