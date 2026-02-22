import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { CustomerReturn, PaginatedResponse } from '@shared/api';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

export interface CustomerReturnFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: string;
  reason?: string;
  startDate?: string;
  endDate?: string;
}

export const useCustomerReturns = (filters: CustomerReturnFilters = {}) => {
  const queryClient = useQueryClient();

  const queryString = buildQueryString({
    page: filters.page || 1,
    pageSize: filters.pageSize || 25,
    search: filters.search,
    status: filters.status,
    customerId: filters.customerId,
    reason: filters.reason,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const { data, isLoading: loading, error, refetch } = useQuery<PaginatedResponse<CustomerReturn>>({
    queryKey: ['customer-returns', filters],
    queryFn: () => api.get<PaginatedResponse<CustomerReturn>>(`/api/customer-returns${queryString}`),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CustomerReturn>) => api.post<CustomerReturn>('/api/customer-returns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/customer-returns/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/customer-returns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
    },
  });

  return {
    returns: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || 25,
    totalPages: data?.totalPages || 1,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createReturn: createMutation.mutateAsync,
    updateStatus: (id: string, status: string) => statusMutation.mutateAsync({ id, status }),
    deleteReturn: deleteMutation.mutateAsync,
  };
};
