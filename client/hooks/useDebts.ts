import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { DebtSummary, PaymentScheduleItem, OverduePayment } from '@shared/api';
import { api } from '@/lib/api';

export const useDebts = () => {
  const { data: debts = [], isLoading: debtsLoading, error, refetch: refetchDebts } = useQuery<DebtSummary[]>({
    queryKey: ['debts-summary'],
    queryFn: () => api.get<DebtSummary[]>('/api/debts/summary'),
    placeholderData: keepPreviousData,
  });

  const { data: paymentSchedule = [], refetch: refetchSchedule } = useQuery<PaymentScheduleItem[]>({
    queryKey: ['debts-schedule'],
    queryFn: () => api.get<PaymentScheduleItem[]>('/api/debts/payment-schedule'),
    placeholderData: keepPreviousData,
  });

  const { data: overduePayments = [], refetch: refetchOverdue } = useQuery<OverduePayment[]>({
    queryKey: ['debts-overdue'],
    queryFn: () => api.get<OverduePayment[]>('/api/debts/overdue'),
    placeholderData: keepPreviousData,
  });

  const refetch = () => {
    refetchDebts();
    refetchSchedule();
    refetchOverdue();
  };

  return {
    debts,
    paymentSchedule,
    overduePayments,
    loading: debtsLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
