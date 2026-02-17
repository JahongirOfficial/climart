import { useState, useEffect } from 'react';
import { Supplier } from '@shared/api';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partners?type=supplier');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      setSuppliers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...supplierData, type: 'supplier' }),
      });

      if (!response.ok) throw new Error('Failed to create supplier');
      
      const newSupplier = await response.json();
      setSuppliers(prev => [newSupplier, ...prev]);
      return newSupplier;
    } catch (err) {
      throw err;
    }
  };

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    try {
      const response = await fetch(`/api/partners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) throw new Error('Failed to update supplier');
      
      const updatedSupplier = await response.json();
      setSuppliers(prev => prev.map(s => s._id === id ? updatedSupplier : s));
      return updatedSupplier;
    } catch (err) {
      throw err;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const response = await fetch(`/api/partners/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete supplier');
      
      setSuppliers(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    error,
    refetch: fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
  };
};
