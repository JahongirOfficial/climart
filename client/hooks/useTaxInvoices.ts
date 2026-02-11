import { useState, useEffect } from 'react';

interface TaxInvoiceItem {
  product: any;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface TaxInvoice {
  _id: string;
  invoiceNumber: string;
  shipment: any;
  shipmentNumber: string;
  customer: any;
  customerName: string;
  organization: string;
  invoiceDate: string;
  items: TaxInvoiceItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  status: 'sent' | 'not_sent';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const useTaxInvoices = () => {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tax-invoices');
      if (!response.ok) throw new Error('Failed to fetch tax invoices');
      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (invoiceData: Partial<TaxInvoice>) => {
    try {
      const response = await fetch('/api/tax-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tax invoice');
      }

      const newInvoice = await response.json();
      await fetchInvoices();
      return newInvoice;
    } catch (err) {
      throw err;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/tax-invoices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      await fetchInvoices();
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const response = await fetch(`/api/tax-invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete tax invoice');
      }

      await fetchInvoices();
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
    createInvoice,
    updateStatus,
    deleteInvoice,
  };
};
