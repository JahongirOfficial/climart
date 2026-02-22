import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerInvoice } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta hisob-fakturani yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useCustomerInvoice = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<CustomerInvoice>({
    queryKey: ['customer-invoice', id],
    queryFn: () => api.get<CustomerInvoice>(`/api/customer-invoices/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (invoiceData: any) =>
      isNew
        ? api.post<any>('/api/customer-invoices', invoiceData)
        : api.put<CustomerInvoice>(`/api/customer-invoices/${id}`, invoiceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ paidAmount, paymentMethod, notes }: { paidAmount: number; paymentMethod?: string; notes?: string }) =>
      api.patch(`/api/customer-invoices/${id}/payment`, { paidAmount, paymentMethod, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/customer-invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
    },
  });

  return {
    invoice: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    recordPayment: (paidAmount: number, paymentMethod?: string, notes?: string) =>
      paymentMutation.mutateAsync({ paidAmount, paymentMethod, notes }),
    deleteInvoice: deleteMutation.mutateAsync,
  };
};
