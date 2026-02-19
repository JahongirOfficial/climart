import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    queryFn: async () => {
      const res = await fetch(`/api/tasks?${queryString}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  const { data: stats } = useQuery<TaskStats>({
    queryKey: ['tasks-stats'],
    queryFn: async () => {
      const res = await fetch('/api/tasks/stats');
      if (!res.ok) throw new Error('Failed to fetch task stats');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create task');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update task');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update task status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      return res.json();
    },
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
