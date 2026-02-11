import { useState, useEffect } from 'react';
import { Shipment } from '@shared/api';

export const useShipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shipments');
      if (!response.ok) throw new Error('Failed to fetch shipments');
      const data = await response.json();
      setShipments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createShipment = async (shipmentData: Partial<Shipment>) => {
    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create shipment');
      }

      const newShipment = await response.json();
      await fetchShipments();
      return newShipment;
    } catch (err) {
      throw err;
    }
  };

  const updateShipment = async (id: string, shipmentData: Partial<Shipment>) => {
    try {
      const response = await fetch(`/api/shipments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update shipment');
      }

      const updatedShipment = await response.json();
      await fetchShipments();
      return updatedShipment;
    } catch (err) {
      throw err;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/shipments/${id}/status`, {
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

      await fetchShipments();
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  const deleteShipment = async (id: string) => {
    try {
      const response = await fetch(`/api/shipments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete shipment');
      }

      await fetchShipments();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const refetch = () => {
    fetchShipments();
  };

  return {
    shipments,
    loading,
    error,
    refetch,
    createShipment,
    updateShipment,
    updateStatus,
    deleteShipment,
  };
};
