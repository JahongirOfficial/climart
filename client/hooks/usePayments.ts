import { useQuery } from '@tanstack/react-query';

export interface Payment {
  _id: string;
  paymentNumber: string;
  type: 'incoming' | 'outgoing' | 'transfer';
  paymentDate: string;
  amount: number;
  partner?: {
    _id: string;
    name: string;
  };
  partnerName?: string;
  organization?: string;
  account: 'cash' | 'bank';
  accountNumber?: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'other';
  purpose: string;
  category?: string;
  linkedDocument?: string;
  linkedDocumentType?: string;
  linkedDocumentNumber?: string;
  fromAccount?: 'cash' | 'bank';
  toAccount?: 'cash' | 'bank';
  status: 'draft' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentsResponse {
  payments: Payment[];
  totals: {
    incoming: number;
    outgoing: number;
    cashBalance: number;
    bankBalance: number;
  };
}

interface UsePaymentsParams {
  type?: 'incoming' | 'outgoing' | 'transfer';
  account?: 'cash' | 'bank';
  startDate?: string;
  endDate?: string;
  partner?: string;
  category?: string;
  status?: 'draft' | 'confirmed' | 'cancelled';
}

export const usePayments = (params?: UsePaymentsParams) => {
  const { data, isLoading, error, refetch } = useQuery<PaymentsResponse>({
    queryKey: ['payments', params],
    queryFn: async () => {
      let url = '/api/payments';
      
      if (params) {
        const searchParams = new URLSearchParams();
        if (params.type) searchParams.append('type', params.type);
        if (params.account) searchParams.append('account', params.account);
        if (params.startDate) searchParams.append('startDate', params.startDate);
        if (params.endDate) searchParams.append('endDate', params.endDate);
        if (params.partner) searchParams.append('partner', params.partner);
        if (params.category) searchParams.append('category', params.category);
        if (params.status) searchParams.append('status', params.status);
        
        const queryString = searchParams.toString();
        if (queryString) url += `?${queryString}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    payments: data?.payments || [],
    totals: data?.totals || { incoming: 0, outgoing: 0, cashBalance: 0, bankBalance: 0 },
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
