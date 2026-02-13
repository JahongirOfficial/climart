import { useQuery } from '@tanstack/react-query';
import { PendingInvoiceResponse } from '@shared/api';

interface UsePendingInvoicesParams {
  startDate?: string;
  endDate?: string;
  customerId?: string;
}

export const usePendingInvoices = (params?: UsePendingInvoicesParams) => {
  const { data: invoices = [], isLoading: loading, error, refetch } = useQuery<PendingInvoiceResponse[]>({
    queryKey: ['pending-invoices', params],
    queryFn: async () => {
      let url = '/api/customer-invoices/pending';
      
      if (params) {
        const searchParams = new URLSearchParams();
        if (params.startDate) searchParams.append('startDate', params.startDate);
        if (params.endDate) searchParams.append('endDate', params.endDate);
        if (params.customerId) searchParams.append('customerId', params.customerId);
        
        const queryString = searchParams.toString();
        if (queryString) url += `?${queryString}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch pending invoices');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    invoices,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
