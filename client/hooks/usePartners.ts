import { useState, useEffect } from 'react';
import { PartnerWithStats } from '@shared/api';

export const usePartners = (type?: 'customer' | 'supplier' | 'both') => {
  const [partners, setPartners] = useState<PartnerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const url = type ? `/api/partners?type=${type}` : '/api/partners';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch partners');
      const data = await response.json();
      setPartners(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [type]);

  const deletePartner = async (id: string) => {
    try {
      const response = await fetch(`/api/partners/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete partner');
      await fetchPartners();
    } catch (err) {
      throw err;
    }
  };

  const refetch = () => {
    fetchPartners();
  };

  return {
    partners,
    loading,
    error,
    refetch,
    deletePartner,
  };
};
