/**
 * Central API client for the Project Management System.
 *
 * All HTTP calls go through here.
 * Phase 2 will add authentication token injection via request interceptors.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

interface ApiError {
  success: false;
  message: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login?expired=true';
    }
  }

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      success: false as const,
      message: 'An unexpected error occurred',
    }));
    throw new Error(errorData.message ?? `HTTP error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
