import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName: string;
  createdBy?: string;
  createdByName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  completedAt?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  pages: number;
}

interface TaskStats {
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export function useTasks(filters: TaskFilters = {}) {
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const queryString = params.toString();

  const { data, isLoading, error, refetch } = useQuery<TasksResponse>({
    queryKey: ['tasks', queryString],
    queryFn: () => api.get<TasksResponse>(`/api/tasks?${queryString}`),
    placeholderData: keepPreviousData,
  });

  const { data: stats } = useQuery<TaskStats>({
    queryKey: ['tasks-stats'],
    queryFn: () => api.get<TaskStats>('/api/tasks/stats'),
  });

  const createMutation = useMutation({
    mutationFn: (taskData: Partial<Task>) => api.post<Task>('/api/tasks', taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      api.put<Task>(`/api/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/tasks/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
    },
  });

  return {
    tasks: data?.tasks || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pages: data?.pages || 1,
    stats: stats || { pending: 0, inProgress: 0, completed: 0, overdue: 0 },
    loading: isLoading,
    error: error?.message || null,
    refetch,
    createTask: createMutation.mutateAsync,
    updateTask: (id: string, data: Partial<Task>) => updateMutation.mutateAsync({ id, data }),
    updateStatus: (id: string, status: string) => updateStatusMutation.mutateAsync({ id, status }),
    deleteTask: deleteMutation.mutateAsync,
  };
}
