import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Product } from '@shared/api';
import { api } from '@/lib/api';

export const useProducts = () => {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: loading, error, refetch } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get<Product[]>('/api/products'),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (productData: Partial<Product>) => api.post<Product>('/api/products', productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      api.put<Product>(`/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    products,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createProduct: createMutation.mutateAsync,
    updateProduct: (id: string, data: Partial<Product>) => updateMutation.mutateAsync({ id, data }),
    deleteProduct: deleteMutation.mutateAsync,
  };
};
