import { useState, useEffect } from 'react';
import { SupplierInvoice } from '@shared/api';

export const useSupplierInvoices = () => {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supplier-invoices');
      if (!response.ok) throw new Error('Failed to fetch supplier invoices');
      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (invoiceId: string, amount: number, notes?: string, paymentMethod: string = 'bank_transfer') => {
    try {
      const invoice = invoices.find(inv => inv._id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplier: invoice.supplier,
          supplierName: invoice.supplierName,
          supplierInvoice: invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          amount,
          paymentMethod,
          notes,
          paymentDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment');
      }
      
      // Refresh invoices after payment
      await fetchInvoices();
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const refetch = () => {
    fetchInvoices();
  };

  return {
    invoices,
    loading,
    error,
    refetch,
    createPayment
  };
};