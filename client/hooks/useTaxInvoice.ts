import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface TaxInvoice {
  _id: string;
  invoiceNumber: string;
  shipment: any;
  shipmentNumber: string;
  customer: any;
  customerName: string;
  organization: string;
  invoiceDate: string;
  items: any[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  status: 'sent' | 'not_sent';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bitta soliq hisob-fakturasini yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useTaxInvoice = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<TaxInvoice>({
    queryKey: ['tax-invoice', id],
    queryFn: () => api.get<TaxInvoice>(`/api/tax-invoices/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (invoiceData: any) =>
      isNew
        ? api.post<any>('/api/tax-invoices', invoiceData)
        : api.put<TaxInvoice>(`/api/tax-invoices/${id}`, invoiceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['tax-invoice', id] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/tax-invoices/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['tax-invoice', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/tax-invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-invoices'] });
    },
  });

  return {
    invoice: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    updateStatus: statusMutation.mutateAsync,
    deleteInvoice: deleteMutation.mutateAsync,
  };
};
