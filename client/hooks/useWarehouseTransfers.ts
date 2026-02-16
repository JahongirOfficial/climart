import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TransferItem {
  product: string;
  productName: string;
  quantity: number;
}

interface WarehouseTransfer {
  _id: string;
  transferNumber: string;
  sourceWarehouse: string;
  sourceWarehouseName: string;
  destinationWarehouse: string;
  destinationWarehouseName: string;
  transferDate: string;
  items: TransferItem[];
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const useWarehouseTransfers = () => {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading: loading, error, refetch } = useQuery<WarehouseTransfer[]>({
    queryKey: ['warehouse-transfers'],
    queryFn: async () => {
      const response = await fetch('/api/warehouse-transfers');
      if (!response.ok) throw new Error('Failed to fetch transfers');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<WarehouseTransfer>) => {
      const response = await fetch('/api/warehouse-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create transfer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/warehouse-transfers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/warehouse-transfers/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete transfer');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
    },
  });

  return {
    transfers,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createTransfer: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteTransfer: deleteMutation.mutateAsync,
  };
};
