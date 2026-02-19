import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

interface InternalOrderItem {
  product: string;
  productName: string;
  requestedQuantity: number;
  shippedQuantity: number;
  costPrice: number;
  total: number;
}

interface InternalOrder {
  _id: string;
  orderNumber: string;
  organization?: string;
  sourceWarehouse: string;
  sourceWarehouseName: string;
  destinationWarehouse: string;
  destinationWarehouseName: string;
  orderDate: string;
  expectedDate?: string;
  items: InternalOrderItem[];
  totalAmount: number;
  shippedAmount: number;
  fulfillmentPercentage: number;
  status: 'new' | 'approved' | 'partial' | 'completed' | 'cancelled';
  transferCreated: boolean;
  transferId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const useInternalOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: loading, error, refetch } = useQuery<InternalOrder[]>({
    queryKey: ['internal-orders'],
    queryFn: async () => {
      const response = await fetch('/api/internal-orders');
      if (!response.ok) throw new Error('Failed to fetch internal orders');
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InternalOrder>) => {
      const response = await fetch('/api/internal-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create internal order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-orders'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/internal-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-orders'] });
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/internal-orders/${id}/create-transfer`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to create transfer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-orders'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/internal-orders/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete internal order');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-orders'] });
    },
  });

  return {
    orders,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createOrder: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    createTransfer: createTransferMutation.mutateAsync,
    deleteOrder: deleteMutation.mutateAsync,
  };
};
