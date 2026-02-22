import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface TaxInvoiceItem {
  product: any;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface TaxInvoice {
  _id: string;
  invoiceNumber: string;
  shipment: any;
  shipmentNumber: string;
  customer: any;
  customerName: string;
  organization: string;
  invoiceDate: string;
  items: TaxInvoiceItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  status: 'sent' | 'not_sent';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const useTaxInvoices = () => {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading: loading, error, refetch } = useQuery<TaxInvoice[]>({
    queryKey: ['tax-invoices'],
    queryFn: () => api.get<TaxInvoice[]>('/api/tax-invoices'),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<TaxInvoice>) => api.post<TaxInvoice>('/api/tax-invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-invoices'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/tax-invoices/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-invoices'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tax-invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-invoices'] });
    },
  });

  return {
    invoices,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createInvoice: createMutation.mutateAsync,
    updateStatus: (id: string, status: string) => statusMutation.mutateAsync({ id, status }),
    deleteInvoice: deleteMutation.mutateAsync,
  };
};
