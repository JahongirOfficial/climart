import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CustomerReturn {
  _id: string;
  returnNumber: string;
  customer: any;
  customerName: string;
  invoice: any;
  invoiceNumber: string;
  returnDate: string;
  status: 'pending' | 'accepted' | 'cancelled';
  items: Array<{
    product: any;
    productName: string;
    quantity: number;
    price: number;
    total: number;
    reason: string;
  }>;
  totalAmount: number;
  reason: string;
  notes?: string;
  organization?: string;
  warehouse?: any;
  warehouseName?: string;
}

export const useCustomerReturns = () => {
  const queryClient = useQueryClient();

  const { data: returns = [], isLoading: loading, error, refetch } = useQuery<CustomerReturn[]>({
    queryKey: ['customer-returns'],
    queryFn: () => api.get<CustomerReturn[]>('/api/customer-returns'),
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
      api.put(`/api/customer-returns/${id}/status`, { status }),
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
    returns,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createReturn: createMutation.mutateAsync,
    updateStatus: (id: string, status: string) => statusMutation.mutateAsync({ id, status }),
    deleteReturn: deleteMutation.mutateAsync,
  };
};
