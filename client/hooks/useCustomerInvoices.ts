import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerInvoice } from '@shared/api';

export const useCustomerInvoices = (filters?: { startDate?: string; endDate?: string }) => {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading: loading, error, refetch } = useQuery<CustomerInvoice[]>({
    queryKey: ['customer-invoices', filters],
    queryFn: async () => {
      let url = '/api/customer-invoices';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        url += `?${params.toString()}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch customer invoices');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: async (invoiceData: Partial<CustomerInvoice>) => {
      const response = await fetch('/api/customer-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create invoice');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerInvoice> }) => {
      const response = await fetch(`/api/customer-invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update invoice');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/customer-invoices/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete invoice');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ id, paidAmount }: { id: string; paidAmount: number }) => {
      const response = await fetch(`/api/customer-invoices/${id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidAmount }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to record payment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
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
    recordPayment: (id: string, paidAmount: number) => paymentMutation.mutateAsync({ id, paidAmount }),
  };
};
