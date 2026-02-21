import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
    queryFn: () => api.get<InternalOrder[]>('/api/internal-orders'),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<InternalOrder>) => api.post<InternalOrder>('/api/internal-orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-orders'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/internal-orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-orders'] });
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/internal-orders/${id}/create-transfer`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-orders'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/internal-orders/${id}`),
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
