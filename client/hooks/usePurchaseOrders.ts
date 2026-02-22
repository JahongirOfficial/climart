import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PurchaseOrderItem {
  product: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplier: any;
  supplierName: string;
  orderDate: string;
  items: PurchaseOrderItem[];
  status: 'pending' | 'received' | 'cancelled' | 'draft' | 'confirmed' | 'Bajarildi' | 'Qabul qilindi' | 'Kutilmoqda' | 'Bekor qilindi';
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const usePurchaseOrders = (filters?: { startDate?: string; endDate?: string; status?: string }) => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: loading, error, refetch } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);

      return api.get<PurchaseOrder[]>(`/api/purchase-orders?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (orderData: Partial<PurchaseOrder>) => {
      return api.post('/api/purchase-orders', orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PurchaseOrder> }) => {
      return api.put(`/api/purchase-orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/purchase-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Logic for receiving order (creating receipt)
      return api.post(`/api/receipts/from-order/${orderId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    orders,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createOrder: createMutation.mutateAsync,
    updateOrder: (id: string, data: Partial<PurchaseOrder>) => updateMutation.mutateAsync({ id, data }),
    deleteOrder: deleteMutation.mutateAsync,
    receiveOrder: receiveMutation.mutateAsync,
  };
};
