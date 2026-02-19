import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

interface InventoryItem {
  product: string;
  productName: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  costPrice: number;
  differenceAmount: number;
}

interface Inventory {
  _id: string;
  inventoryNumber: string;
  warehouse: string;
  warehouseName: string;
  organization?: string;
  inventoryDate: string;
  status: 'draft' | 'confirmed';
  category?: string;
  items: InventoryItem[];
  totalShortage: number;
  totalSurplus: number;
  shortageAmount: number;
  surplusAmount: number;
  writeoffCreated: boolean;
  receiptCreated: boolean;
  writeoffId?: string;
  receiptId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const useInventory = () => {
  const queryClient = useQueryClient();

  const { data: inventories = [], isLoading: loading, error, refetch } = useQuery<Inventory[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await fetch('/api/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventories');
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Inventory>) => {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create inventory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/inventory/${id}/confirm`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to confirm inventory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  const createWriteoffMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/inventory/${id}/create-writeoff`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to create writeoff');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
    },
  });

  const createReceiptMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/inventory/${id}/create-receipt`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to create receipt');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete inventory');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  return {
    inventories,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createInventory: createMutation.mutateAsync,
    confirmInventory: confirmMutation.mutateAsync,
    createWriteoff: createWriteoffMutation.mutateAsync,
    createReceipt: createReceiptMutation.mutateAsync,
    deleteInventory: deleteMutation.mutateAsync,
  };
};
