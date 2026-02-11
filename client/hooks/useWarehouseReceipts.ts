import { useState, useEffect } from 'react';
import { WarehouseReceipt } from '@shared/api';

export const useWarehouseReceipts = (warehouseId?: string) => {
  const [receipts, setReceipts] = useState<WarehouseReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const url = warehouseId ? `/api/warehouse-receipts?warehouse=${warehouseId}` : '/api/warehouse-receipts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch receipts');
      const data = await response.json();
      setReceipts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [warehouseId]);

  const confirmReceipt = async (id: string) => {
    try {
      const response = await fetch(`/api/warehouse-receipts/${id}/confirm`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to confirm receipt');
      await fetchReceipts();
    } catch (err) {
      throw err;
    }
  };

  const deleteReceipt = async (id: string) => {
    try {
      const response = await fetch(`/api/warehouse-receipts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete receipt');
      await fetchReceipts();
    } catch (err) {
      throw err;
    }
  };

  const refetch = () => {
    fetchReceipts();
  };

  return {
    receipts,
    loading,
    error,
    refetch,
    confirmReceipt,
    deleteReceipt,
  };
};
