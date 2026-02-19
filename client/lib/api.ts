// Centralized API fetch helper - replaces duplicated fetch + auth patterns in 40+ hooks

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options?.body && typeof options.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Request failed');
    throw new ApiError(errorText || `Request failed with status ${response.status}`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// Convenience methods
export const api = {
  get: <T>(url: string) => apiFetch<T>(url),

  post: <T>(url: string, data: unknown) =>
    apiFetch<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  put: <T>(url: string, data: unknown) =>
    apiFetch<T>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: <T>(url: string) =>
    apiFetch<T>(url, { method: 'DELETE' }),
};
