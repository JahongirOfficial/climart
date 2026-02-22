import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Shipment, PaginatedResponse } from '@shared/api';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

export interface ShipmentFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
}

export const useShipments = (filters: ShipmentFilters = {}) => {
  const queryClient = useQueryClient();

  const queryString = buildQueryString({
    page: filters.page || 1,
    pageSize: filters.pageSize || 25,
    search: filters.search,
    status: filters.status,
    customerId: filters.customerId,
    warehouseId: filters.warehouseId,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const { data, isLoading: loading, error, refetch } = useQuery<PaginatedResponse<Shipment>>({
    queryKey: ['shipments', filters],
    queryFn: () => api.get<PaginatedResponse<Shipment>>(`/api/shipments${queryString}`),
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
      api.patch(`/api/shipments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/shipments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });

  return {
    shipments: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || 25,
    totalPages: data?.totalPages || 1,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createShipment: createMutation.mutateAsync,
    updateShipment: (id: string, data: Partial<Shipment>) => updateMutation.mutateAsync({ id, data }),
    updateStatus: (id: string, status: string) => statusMutation.mutateAsync({ id, status }),
    deleteShipment: deleteMutation.mutateAsync,
  };
};
