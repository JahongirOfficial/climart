import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { SupplierInvoice } from '@shared/api';
import { api } from '@/lib/api';

export const useSupplierInvoices = () => {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading: loading, error, refetch } = useQuery<SupplierInvoice[]>({
    queryKey: ['supplier-invoices'],
    queryFn: () => api.get<SupplierInvoice[]>('/api/supplier-invoices'),
    placeholderData: keepPreviousData,
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ invoiceId, amount, notes, paymentMethod = 'bank_transfer' }: {
      invoiceId: string; amount: number; notes?: string; paymentMethod?: string;
    }) => {
      const invoice = invoices.find(inv => inv._id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      return api.post('/api/payments', {
        supplier: invoice.supplier,
        supplierName: invoice.supplierName,
        supplierInvoice: invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        paymentMethod,
        notes,
        paymentDate: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  return {
    invoices,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createPayment: (invoiceId: string, amount: number, notes?: string, paymentMethod?: string) =>
      paymentMutation.mutateAsync({ invoiceId, amount, notes, paymentMethod }),
  };
};
