import { useState, useEffect } from 'react';
import { Writeoff } from '@shared/api';

export const useWriteoffs = (warehouseId?: string) => {
  const [writeoffs, setWriteoffs] = useState<Writeoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWriteoffs = async () => {
    try {
      setLoading(true);
      const url = warehouseId ? `/api/writeoffs?warehouse=${warehouseId}` : '/api/writeoffs';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch writeoffs');
      const data = await response.json();
      setWriteoffs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWriteoffs();
  }, [warehouseId]);

  const confirmWriteoff = async (id: string) => {
    try {
      const response = await fetch(`/api/writeoffs/${id}/confirm`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      await fetchWriteoffs();
    } catch (err) {
      throw err;
    }
  };

  const deleteWriteoff = async (id: string) => {
    try {
      const response = await fetch(`/api/writeoffs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete writeoff');
      await fetchWriteoffs();
    } catch (err) {
      throw err;
    }
  };

  const refetch = () => {
    fetchWriteoffs();
  };

  return {
    writeoffs,
    loading,
    error,
    refetch,
    confirmWriteoff,
    deleteWriteoff,
  };
};
