import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { CustomerInvoice } from '@shared/api';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

export const useCustomerInvoices = (filters?: { startDate?: string; endDate?: string }) => {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading: loading, error, refetch } = useQuery<CustomerInvoice[]>({
    queryKey: ['customer-invoices', filters],
    queryFn: () => api.get<CustomerInvoice[]>(`/api/customer-invoices${buildQueryString({ startDate: filters?.startDate, endDate: filters?.endDate })}`),
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
    invoices,
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
