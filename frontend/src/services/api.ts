export const cleanApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
export const API_BASE = cleanApiBaseUrl 
  ? `${cleanApiBaseUrl}/api/v1`
  : '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('squid_token_backup');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include HttpOnly cookies
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType && contentType.includes('text/csv')) {
    data = await response.text();
    return data as unknown as T;
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP ${response.status} Request Failed`;
    throw new ApiError(response.status, errorMsg, data);
  }

  return data as T;
}
