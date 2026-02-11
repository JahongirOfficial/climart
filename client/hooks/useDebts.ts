import { useState, useEffect } from 'react';
import { DebtSummary, PaymentScheduleItem, OverduePayment } from '@shared/api';

export const useDebts = () => {
  const [debts, setDebts] = useState<DebtSummary[]>([]);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debts/summary');
      if (!response.ok) throw new Error('Failed to fetch debts');
      const data = await response.json();
      setDebts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSchedule = async () => {
    try {
      const response = await fetch('/api/debts/payment-schedule');
      if (!response.ok) throw new Error('Failed to fetch payment schedule');
      const data = await response.json();
      setPaymentSchedule(data);
    } catch (err) {
      console.error('Error fetching payment schedule:', err);
    }
  };

  const fetchOverduePayments = async () => {
    try {
      const response = await fetch('/api/debts/overdue');
      if (!response.ok) throw new Error('Failed to fetch overdue payments');
      const data = await response.json();
      setOverduePayments(data);
    } catch (err) {
      console.error('Error fetching overdue payments:', err);
    }
  };

  useEffect(() => {
    fetchDebts();
    fetchPaymentSchedule();
    fetchOverduePayments();
  }, []);

  const refetch = () => {
    fetchDebts();
    fetchPaymentSchedule();
    fetchOverduePayments();
  };

  return {
    debts,
    paymentSchedule,
    overduePayments,
    loading,
    error,
    refetch
  };
};