import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { CustomerOrder, PaginatedResponse } from '@shared/api';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

export interface CustomerOrderFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  shipmentStatus?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const useCustomerOrders = (filters: CustomerOrderFilters = {}) => {
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
    paymentStatus: filters.paymentStatus,
    shipmentStatus: filters.shipmentStatus,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const { data, isLoading: loading, error, refetch } = useQuery<PaginatedResponse<CustomerOrder>>({
    queryKey: ['customer-orders', filters],
    queryFn: () => api.get<PaginatedResponse<CustomerOrder>>(`/api/customer-orders${queryString}`),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (orderData: Partial<CustomerOrder>) => api.post<any>('/api/customer-orders', orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerOrder> }) =>
      api.put<CustomerOrder>(`/api/customer-orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/customer-orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/customer-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });

  return {
    orders: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || 25,
    totalPages: data?.totalPages || 1,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createOrder: createMutation.mutateAsync,
    updateOrder: (id: string, data: Partial<CustomerOrder>) => updateMutation.mutateAsync({ id, data }),
    updateStatus: (id: string, status: string) => statusMutation.mutateAsync({ id, status }),
    deleteOrder: deleteMutation.mutateAsync,
  };
};
