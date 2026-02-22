import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
      return api.get<WarehouseTransfer[]>('/api/warehouse-transfers');
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<WarehouseTransfer>) => {
      return api.post('/api/warehouse-transfers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/api/warehouse-transfers/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/warehouse-transfers/${id}`);
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
