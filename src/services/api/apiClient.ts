/**
 * MABOL Centralized API Client
 * - Standardized fetch wrapper with credentials: 'include' (HttpOnly cookie support)
 * - Bearer token fallback for authorization headers
 * - Robust error handling for 401, 403, 404, 409, 429, 5xx, and network timeouts
 * - Zero secret leakage to logs/console
 */

import { getAuthToken } from '../authService';

export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public data: any;
  public isNetworkError: boolean;
  public isAuthError: boolean;
  public isForbidden: boolean;
  public isConflict: boolean;
  public isRateLimited: boolean;
  public isValidationError: boolean;
  public isServerError: boolean;

  constructor(message: string, status: number = 0, statusText: string = '', data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.isNetworkError = status === 0;
    this.isAuthError = status === 401;
    this.isForbidden = status === 403;
    this.isConflict = status === 409;
    this.isRateLimited = status === 429;
    this.isValidationError = status === 400;
    this.isServerError = status >= 500;
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15000;

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

  // Build Headers
  const headers = new Headers(customHeaders || {});
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Add Bearer token from localStorage if available and not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Setup AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Ensure session cookies (mabol_token) are sent with every request
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    // Try parsing JSON payload if present
    const contentType = response.headers.get('content-type') || '';
    let responseData: any = null;
    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      try {
        responseData = await response.text();
      } catch {
        responseData = null;
      }
    }

    if (!response.ok) {
      let errorMessage = 'Terjadi kesalahan pada server.';
      if (responseData && typeof responseData === 'object' && responseData.error) {
        errorMessage = responseData.error;
      } else if (response.status === 401) {
        errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
      } else if (response.status === 403) {
        errorMessage = 'Akses ditolak. Anda tidak memiliki wewenang untuk tindakan ini.';
      } else if (response.status === 404) {
        errorMessage = 'Data atau endpoint tidak ditemukan.';
      } else if (response.status === 409) {
        errorMessage = responseData?.error || 'Terjadi konflik data pada server.';
      } else if (response.status === 429) {
        errorMessage = 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.';
      } else if (response.status >= 500) {
        errorMessage = 'Layanan server sedang mengalami kendala. Coba lagi beberapa saat.';
      }

      throw new ApiError(errorMessage, response.status, response.statusText, responseData);
    }

    return responseData as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiError('Permintaan timeout. Koneksi server terlalu lambat.', 0, 'Timeout');
    }

    // Generic network or offline error
    throw new ApiError(
      'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      0,
      'NetworkError'
    );
  }
}

export function apiGet<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

export function apiPost<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

export function apiPut<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

export function apiDelete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}
