import { useState, useEffect } from 'react';

interface ReturnsReportData {
  summary: {
    totalReturns: number;
    totalValue: number;
    averageReturnValue: number;
  };
  byReason: Record<string, { count: number; value: number }>;
  topReturnedProducts: Array<{
    productName: string;
    quantity: number;
    value: number;
  }>;
  topReturningCustomers: Array<{
    customerName: string;
    returns: number;
    value: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    value: number;
  }>;
  returns: any[];
}

export const useReturnsReport = (startDate?: string, endDate?: string) => {
  const [data, setData] = useState<ReturnsReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/returns-report?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch returns report');
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
  }, [startDate, endDate]);

  return {
    data,
    loading,
    error,
    refetch: fetchReport,
  };
};
