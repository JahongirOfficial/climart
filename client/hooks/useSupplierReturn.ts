import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierReturn } from '@shared/api';
import { api } from '@/lib/api';

/**
 * Bitta yetkazuvchiga qaytarishni yuklash va boshqarish uchun hook.
 * Detail sahifada ishlatiladi.
 */
export const useSupplierReturn = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data, isLoading: loading, error, refetch } = useQuery<SupplierReturn>({
    queryKey: ['supplier-return', id],
    queryFn: () => api.get<SupplierReturn>(`/api/supplier-returns/${id}`),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (returnData: any) =>
      api.post<any>('/api/supplier-returns', returnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-returns'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-return', id] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/supplier-returns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-returns'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    returnDoc: data || null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    save: saveMutation.mutateAsync,
    saving: saveMutation.isPending,
    deleteReturn: deleteMutation.mutateAsync,
  };
};
