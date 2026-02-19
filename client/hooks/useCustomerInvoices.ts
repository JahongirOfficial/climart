import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { CustomerInvoice } from '@shared/api';
import { api, apiFetch } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

export const useCustomerInvoices = (filters?: { startDate?: string; endDate?: string }) => {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading: loading, error, refetch } = useQuery<CustomerInvoice[]>({
    queryKey: ['customer-invoices', filters],
    queryFn: () => api.get<CustomerInvoice[]>(`/api/customer-invoices${buildQueryString({ startDate: filters?.startDate, endDate: filters?.endDate })}`),
    placeholderData: keepPreviousData,
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
    mutationFn: async ({ id, paidAmount, paymentMethod, notes }: { 
      id: string; 
      paidAmount: number;
      paymentMethod?: string;
      notes?: string;
    }) => {
      const response = await fetch(`/api/customer-invoices/${id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidAmount, paymentMethod, notes }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to record payment');
      }
      return response.json();
    },
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
