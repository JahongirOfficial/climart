import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

interface Warehouse {
  _id: string;
  name: string;
  code: string;
  address: string;
  contactPerson?: string;
  phone?: string;
  capacity?: number;
  color?: string;
  isActive: boolean;
  notes?: string;
}

export const useWarehouses = () => {
  const queryClient = useQueryClient();

  const { data: warehouses = [], isLoading: loading, error, refetch } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await fetch('/api/warehouses');
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (warehouseData: Partial<Warehouse>) => {
      const response = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warehouseData),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create warehouse');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Warehouse> }) => {
      const response = await fetch(`/api/warehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update warehouse');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete warehouse');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  return {
    warehouses,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createWarehouse: createMutation.mutateAsync,
    updateWarehouse: (id: string, data: Partial<Warehouse>) => updateMutation.mutateAsync({ id, data }),
    deleteWarehouse: deleteMutation.mutateAsync,
  };
};
