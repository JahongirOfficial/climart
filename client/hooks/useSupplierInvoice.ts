import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierInvoice } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta yetkazuvchi hisob-fakturasini yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useSupplierInvoice = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<SupplierInvoice>({
    queryKey: ['supplier-invoice', id],
    queryFn: () => api.get<SupplierInvoice>(`/api/supplier-invoices/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (invoiceData: any) =>
      isNew
        ? api.post<any>('/api/supplier-invoices', invoiceData)
        : api.put<SupplierInvoice>(`/api/supplier-invoices/${id}`, invoiceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-invoice', id] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (paymentData: { amount: number; notes?: string; method?: string }) =>
      api.post(`/api/supplier-invoices/${id}/payment`, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/supplier-invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
    },
  });

  return {
    invoice: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    createPayment: paymentMutation.mutateAsync,
    deleteInvoice: deleteMutation.mutateAsync,
  };
};
