import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
      return api.get<Warehouse[]>('/api/warehouses');
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (warehouseData: Partial<Warehouse>) => {
      return api.post('/api/warehouses', warehouseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Warehouse> }) => {
      return api.put(`/api/warehouses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/warehouses/${id}`);
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
