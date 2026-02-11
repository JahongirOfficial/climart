import { useState, useEffect } from 'react';

interface CustomerDebt {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  totalSales: number;
  totalPaid: number;
  totalReturns: number;
  totalPayments: number;
  debt: number;
  overdueAmount: number;
  lastOperationDate: string | null;
  shipmentsCount: number;
  returnsCount: number;
  paymentsCount: number;
  transactions: Array<{
    type: string;
    date: string;
    number: string;
    amount: number;
    paid: number;
    balance: number;
  }>;
}

interface DebtsData {
  summary: {
    totalCustomers: number;
    totalDebt: number;
    totalOverdue: number;
    totalSales: number;
    totalPaid: number;
    customersWithDebt: number;
    customersWithOverdue: number;
  };
  debts: CustomerDebt[];
}

export const useCustomerDebts = (startDate?: string, endDate?: string, customerId?: string) => {
  const [data, setData] = useState<DebtsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (customerId) params.append('customerId', customerId);
      
      const response = await fetch(`/api/customer-debts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch customer debts');
      const debtsData = await response.json();
      setData(debtsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [startDate, endDate, customerId]);

  return {
    data,
    loading,
    error,
    refetch: fetchDebts,
  };
};

export const useReconciliationReport = (customerId: string, startDate?: string, endDate?: string) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/customer-debts/${customerId}/reconciliation?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch reconciliation report');
      const reportData = await response.json();
      setData(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchReport();
    }
  }, [customerId, startDate, endDate]);

  return {
    data,
    loading,
    error,
    refetch: fetchReport,
  };
};
