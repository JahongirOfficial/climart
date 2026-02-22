import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { CorrectedInvoiceResponse } from '@shared/api';
import { api } from '@/lib/api';

interface UseCorrectedInvoicesParams {
  startDate?: string;
  endDate?: string;
  productId?: string;
}

export const useCorrectedInvoices = (params?: UseCorrectedInvoicesParams) => {
  const { data: invoices = [], isLoading: loading, error, refetch } = useQuery<CorrectedInvoiceResponse[]>({
    queryKey: ['corrected-invoices', params],
    queryFn: async () => {
      let url = '/api/customer-invoices/corrected';

      if (params) {
        const searchParams = new URLSearchParams();
        if (params.startDate) searchParams.append('startDate', params.startDate);
        if (params.endDate) searchParams.append('endDate', params.endDate);
        if (params.productId) searchParams.append('productId', params.productId);

        const queryString = searchParams.toString();
        if (queryString) url += `?${queryString}`;
      }

      return api.get<CorrectedInvoiceResponse[]>(url);
    },
    placeholderData: keepPreviousData,
  });

  return {
    invoices,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
