import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shipment } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta jo'natishni yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useShipment = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<Shipment>({
    queryKey: ['shipment', id],
    queryFn: () => api.get<Shipment>(`/api/shipments/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (shipmentData: any) =>
      isNew
        ? api.post<any>('/api/shipments', shipmentData)
        : api.put<Shipment>(`/api/shipments/${id}`, shipmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipment', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/shipments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipment', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/shipments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });

  return {
    shipment: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    updateStatus: statusMutation.mutateAsync,
    deleteShipment: deleteMutation.mutateAsync,
  };
};
