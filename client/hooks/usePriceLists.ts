import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { buildQueryString } from '@/lib/format';

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
  const { data: priceLists = [], isLoading: loading, error, refetch } = useQuery<PriceList[]>({
    queryKey: ['price-lists', options],
    queryFn: () => api.get<PriceList[]>(`/api/price-lists${buildQueryString({ status: options?.status, organization: options?.organization })}`),
    placeholderData: keepPreviousData,
  });

  return {
    priceLists,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
