import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta mahsulotni yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useProductDetail = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => api.get<Product>(`/api/products/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (productData: any) =>
      isNew
        ? api.post<Product>('/api/products', productData)
        : api.put<Product>(`/api/products/${id}`, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    product: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    deleteProduct: deleteMutation.mutateAsync,
  };
};
