import { useState, useEffect } from 'react';

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
  const [returns, setReturns] = useState<CustomerReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer-returns');
      if (!response.ok) throw new Error('Failed to fetch customer returns');
      const data = await response.json();
      setReturns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createReturn = async (returnData: Partial<CustomerReturn>) => {
    try {
      const response = await fetch('/api/customer-returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create return');
      }

      const newReturn = await response.json();
      await fetchReturns();
      return newReturn;
    } catch (err) {
      throw err;
    }
  };

  const deleteReturn = async (id: string) => {
    try {
      const response = await fetch(`/api/customer-returns/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete return');
      }

      await fetchReturns();
    } catch (err) {
      throw err;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/customer-returns/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      await fetchReturns();
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const refetch = () => {
    fetchReturns();
  };

  return {
    returns,
    loading,
    error,
    refetch,
    createReturn,
    updateStatus,
    deleteReturn,
  };
};
