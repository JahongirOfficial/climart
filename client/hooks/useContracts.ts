import { useState, useEffect } from 'react';
import { Contract } from '@shared/api';

export const useContracts = (partnerId?: string) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const url = partnerId ? `/api/contracts?partner=${partnerId}` : '/api/contracts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();
      setContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [partnerId]);

  const setAsDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/contracts/${id}/set-default`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to set as default');
      await fetchContracts();
    } catch (err) {
      throw err;
    }
  };

  const cancelContract = async (id: string) => {
    try {
      const response = await fetch(`/api/contracts/${id}/cancel`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to cancel contract');
      await fetchContracts();
    } catch (err) {
      throw err;
    }
  };

  const deleteContract = async (id: string) => {
    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contract');
      await fetchContracts();
    } catch (err) {
      throw err;
    }
  };

  const refetch = () => {
    fetchContracts();
  };

  return {
    contracts,
    loading,
    error,
    refetch,
    setAsDefault,
    cancelContract,
    deleteContract,
  };
};
