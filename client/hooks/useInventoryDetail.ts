import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryDoc } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta inventarizatsiyani yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useInventoryDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<InventoryDoc>({
    queryKey: ['inventory', id],
    queryFn: () => api.get<InventoryDoc>(`/api/inventory/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (inventoryData: any) =>
      isNew
        ? api.post<any>('/api/inventory', inventoryData)
        : api.put<InventoryDoc>(`/api/inventory/${id}`, inventoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.patch<InventoryDoc>(`/api/inventory/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const createWriteoffMutation = useMutation({
    mutationFn: () =>
      api.post<any>(`/api/inventory/${id}/create-writeoff`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', id] });
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const createReceiptMutation = useMutation({
    mutationFn: () =>
      api.post<any>(`/api/inventory/${id}/create-receipt`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', id] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Ombordagi mahsulotlarni auto-fill uchun yuklash
  const loadProducts = async (warehouseId: string) => {
    return api.get<any[]>(`/api/inventory/warehouse/${warehouseId}/products`);
  };

  return {
    inventory: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    confirm: confirmMutation.mutateAsync,
    createWriteoff: createWriteoffMutation.mutateAsync,
    createReceipt: createReceiptMutation.mutateAsync,
    deleteInventory: deleteMutation.mutateAsync,
    loadProducts,
  };
};
