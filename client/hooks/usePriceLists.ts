import { useState, useEffect } from 'react';

export interface PriceListItem {
  product: string;
  productName: string;
  sku?: string;
  unit: string;
  oldPrice: number;
  newPrice: number;
  priceChange: number;
}

export interface PriceList {
  _id: string;
  priceListNumber: string;
  name: string;
  organization?: string;
  validFrom: string;
  validTo?: string;
  status: 'draft' | 'active' | 'archived';
  markupPercent?: number;
  items: PriceListItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface UsePriceListsOptions {
  status?: string;
  organization?: string;
}

export const usePriceLists = (options?: UsePriceListsOptions) => {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceLists = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.organization) params.append('organization', options.organization);

      const response = await fetch(`/api/price-lists?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch price lists');
      
      const data = await response.json();
      setPriceLists(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceLists();
  }, [options?.status, options?.organization]);

  const refetch = () => {
    fetchPriceLists();
  };

  return {
    priceLists,
    loading,
    error,
    refetch
  };
};
