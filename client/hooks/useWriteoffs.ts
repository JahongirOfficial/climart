import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

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
    queryFn: async () => {
      const response = await fetch('/api/writeoffs');
      if (!response.ok) throw new Error('Failed to fetch writeoffs');
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Writeoff>) => {
      const response = await fetch('/api/writeoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create writeoff');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/writeoffs/${id}/confirm`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to confirm writeoff');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/writeoffs/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete writeoff');
    },
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
