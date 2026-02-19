import { useQuery } from '@tanstack/react-query';

export interface AuditLogEntry {
  _id: string;
  user?: string;
  userName: string;
  action: 'create' | 'update' | 'delete';
  entity: string;
  entityId?: string;
  entityName: string;
  changes?: Record<string, { old?: any; new?: any }>;
  ipAddress?: string;
  createdAt: string;
}

interface AuditResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pages: number;
}

interface AuditFilters {
  user?: string;
  entity?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useAuditLog(filters: AuditFilters = {}) {
  const params = new URLSearchParams();
  if (filters.user) params.set('user', filters.user);
  if (filters.entity) params.set('entity', filters.entity);
  if (filters.action) params.set('action', filters.action);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const queryString = params.toString();

  const { data, isLoading, error, refetch } = useQuery<AuditResponse>({
    queryKey: ['audit-logs', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/audit?${queryString}`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    },
  });

  return {
    logs: data?.logs || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pages: data?.pages || 1,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}
