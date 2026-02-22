import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { CustomerInvoice, PaginatedResponse } from '@shared/api';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

export interface CustomerInvoiceFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: string;
  warehouseId?: string;
  shippedStatus?: string;
  startDate?: string;
  endDate?: string;
}

export const useCustomerInvoices = (filters: CustomerInvoiceFilters = {}) => {
  const queryClient = useQueryClient();

  const queryString = buildQueryString({
    page: filters.page || 1,
    pageSize: filters.pageSize || 25,
    search: filters.search,
    status: filters.status,
    customerId: filters.customerId,
    warehouseId: filters.warehouseId,
    shippedStatus: filters.shippedStatus,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const { data, isLoading: loading, error, refetch } = useQuery<PaginatedResponse<CustomerInvoice>>({
    queryKey: ['customer-invoices', filters],
    queryFn: () => api.get<PaginatedResponse<CustomerInvoice>>(`/api/customer-invoices${queryString}`),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (invoiceData: Partial<CustomerInvoice>) => api.post<CustomerInvoice>('/api/customer-invoices', invoiceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerInvoice> }) =>
      api.put<CustomerInvoice>(`/api/customer-invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/customer-invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, paidAmount, paymentMethod, notes }: {
      id: string;
      paidAmount: number;
      paymentMethod?: string;
      notes?: string;
    }) => api.patch(`/api/customer-invoices/${id}/payment`, { paidAmount, paymentMethod, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  return {
    invoices: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || 25,
    totalPages: data?.totalPages || 1,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createInvoice: createMutation.mutateAsync,
    updateInvoice: (id: string, data: Partial<CustomerInvoice>) => updateMutation.mutateAsync({ id, data }),
    deleteInvoice: deleteMutation.mutateAsync,
    recordPayment: (id: string, paidAmount: number, paymentMethod?: string, notes?: string) =>
      paymentMutation.mutateAsync({ id, paidAmount, paymentMethod, notes }),
  };
};
