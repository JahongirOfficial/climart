import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
    queryFn: () => api.get<Inventory[]>('/api/inventory'),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Inventory>) => api.post<Inventory>('/api/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/inventory/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  const createWriteoffMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/inventory/${id}/create-writeoff`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
    },
  });

  const createReceiptMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/inventory/${id}/create-receipt`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/inventory/${id}`),
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
