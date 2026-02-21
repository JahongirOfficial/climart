import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface WriteoffItem {
  product: string;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

interface Writeoff {
  _id: string;
  writeoffNumber: string;
  warehouse: string;
  warehouseName: string;
  organization?: string;
  writeoffDate: string;
  status: 'draft' | 'confirmed';
  items: WriteoffItem[];
  totalAmount: number;
  reason: 'damaged' | 'expired' | 'lost' | 'personal_use' | 'inventory_shortage' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const useWriteoffs = () => {
  const queryClient = useQueryClient();

  const { data: writeoffs = [], isLoading: loading, error, refetch } = useQuery<Writeoff[]>({
    queryKey: ['writeoffs'],
    queryFn: () => api.get<Writeoff[]>('/api/writeoffs'),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Writeoff>) => api.post<Writeoff>('/api/writeoffs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/writeoffs/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/writeoffs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
    },
  });

  return {
    writeoffs,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createWriteoff: createMutation.mutateAsync,
    confirmWriteoff: confirmMutation.mutateAsync,
    deleteWriteoff: deleteMutation.mutateAsync,
  };
};
