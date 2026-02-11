import { useState, useEffect } from 'react';
import { SupplierReturn } from '@shared/api';

export const useSupplierReturns = () => {
  const [returns, setReturns] = useState<SupplierReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supplier-returns');
      if (!response.ok) throw new Error('Failed to fetch returns');
      const data = await response.json();
      setReturns(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createReturn = async (returnData: Partial<SupplierReturn>) => {
    try {
      const response = await fetch('/api/supplier-returns', {
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
      setReturns(prev => [newReturn, ...prev]);
      return newReturn;
    } catch (err) {
      throw err;
    }
  };

  const deleteReturn = async (id: string) => {
    try {
      const response = await fetch(`/api/supplier-returns/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete return');
      
      setReturns(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  return { 
    returns, 
    loading, 
    error, 
    refetch: fetchReturns,
    createReturn,
    deleteReturn
  };
};