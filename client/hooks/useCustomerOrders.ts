import { useState, useEffect } from 'react';
import { CustomerOrder } from '@shared/api';

export const useCustomerOrders = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer-orders');
      if (!response.ok) throw new Error('Failed to fetch customer orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: Partial<CustomerOrder>) => {
    try {
      const response = await fetch('/api/customer-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const newOrder = await response.json();
      await fetchOrders();
      return newOrder;
    } catch (err) {
      throw err;
    }
  };

  const updateOrder = async (id: string, orderData: Partial<CustomerOrder>) => {
    try {
      const response = await fetch(`/api/customer-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order');
      }

      const updatedOrder = await response.json();
      await fetchOrders();
      return updatedOrder;
    } catch (err) {
      throw err;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/customer-orders/${id}/status`, {
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

      await fetchOrders();
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/customer-orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete order');
      }

      await fetchOrders();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const refetch = () => {
    fetchOrders();
  };

  return {
    orders,
    loading,
    error,
    refetch,
    createOrder,
    updateOrder,
    updateStatus,
    deleteOrder,
  };
};
