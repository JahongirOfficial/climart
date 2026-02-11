import { useState, useEffect } from 'react';

interface ProfitabilityData {
  summary: {
    sales: {
      revenue: number;
      cost: number;
      profit: number;
      quantity: number;
      count: number;
    };
    returns: {
      revenue: number;
      cost: number;
      loss: number;
      quantity: number;
      count: number;
    };
    net: {
      revenue: number;
      cost: number;
      profit: number;
      profitMargin: number;
    };
  };
  groupedData: Array<{
    name: string;
    salesQuantity: number;
    salesRevenue: number;
    salesCost: number;
    salesProfit: number;
    salesCount?: number;
    returnQuantity: number;
    returnRevenue: number;
    returnCost: number;
    returnLoss: number;
    returnCount?: number;
    netRevenue: number;
    netCost: number;
    netProfit: number;
    profitMargin: number;
  }>;
  groupBy: string;
}

export const useProfitability = (startDate?: string, endDate?: string, groupBy: string = 'products') => {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (groupBy) params.append('groupBy', groupBy);
      
      const response = await fetch(`/api/profitability?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch profitability report');
      const reportData = await response.json();
      setData(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, groupBy]);

  return {
    data,
    loading,
    error,
    refetch: fetchReport,
  };
};
