import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

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

      const response = await fetch(`/api/purchase-orders?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch purchase orders');
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (orderData: Partial<PurchaseOrder>) => {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PurchaseOrder> }) => {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete order');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Logic for receiving order (creating receipt)
      const response = await fetch(`/api/receipts/from-order/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Assume backend handles mapping if not provided
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to receive order');
      }
      return response.json();
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