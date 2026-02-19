import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Shipment } from '@shared/api';
import { api } from '@/lib/api';

export const useShipments = () => {
  const queryClient = useQueryClient();

  const { data: shipments = [], isLoading: loading, error, refetch } = useQuery<Shipment[]>({
    queryKey: ['shipments'],
    queryFn: () => api.get<Shipment[]>('/api/shipments'),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Shipment>) => api.post<Shipment>('/api/shipments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Shipment> }) =>
      api.put<Shipment>(`/api/shipments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/api/shipments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/shipments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });

  return {
    shipments,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createShipment: createMutation.mutateAsync,
    updateShipment: (id: string, data: Partial<Shipment>) => updateMutation.mutateAsync({ id, data }),
    updateStatus: (id: string, status: string) => statusMutation.mutateAsync({ id, status }),
    deleteShipment: deleteMutation.mutateAsync,
  };
};
