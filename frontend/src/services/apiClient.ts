/**
 * Centralized Typed API Client for SIH26023
 * Handles timeouts, role headers (RBAC), standardized error mapping, and network fault detection.
 */

import { UserRole } from '@/types';

export class ApiError extends Error {
  status: number;
  errorCode: string;
  details?: Record<string, unknown>;

  constructor(status: number, errorCode: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  userRole?: UserRole;
  params?: Record<string, string | number | boolean | undefined | null>;
}

const DEFAULT_TIMEOUT_MS = 30000;

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    userRole,
    params,
    headers: customHeaders,
    ...fetchOptions
  } = options;

  // Build query string if params provided
  let url = endpoint;
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Active Role and Account Resolution
  let activeRole: UserRole = 'VIEWER';
  let accountType = 'PUBLIC_VIEWER';

  if (typeof window !== 'undefined') {
    try {
      const userStr = localStorage.getItem('cil_auth_user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        accountType = parsed.accountType || 'PUBLIC_VIEWER';
        if (accountType === 'PUBLIC_VIEWER' || parsed.authorizedRole === 'VIEWER') {
          activeRole = 'VIEWER';
        } else {
          activeRole = userRole || (localStorage.getItem('cil_user_role') as UserRole) || parsed.authorizedRole || 'ANALYST';
        }
      } else {
        // Unauthenticated session -> least privilege VIEWER
        activeRole = 'VIEWER';
        accountType = 'PUBLIC_VIEWER';
      }
    } catch {
      activeRole = 'VIEWER';
      accountType = 'PUBLIC_VIEWER';
    }
  }

  // Cryptographic Bearer Token (Server-Verified Session)
  let authToken: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      authToken = localStorage.getItem('cil_auth_token');
    } catch {
      // Ignored
    }
  }

  const headers = new Headers(customHeaders);
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
    headers.set('X-Auth-Token', authToken);
  }
  headers.set('X-User-Role', activeRole);
  headers.set('X-Account-Type', accountType);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Don't set Content-Type if uploading FormData (browser sets boundary automatically)
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Try parsing JSON
    let data: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const errObj = data as { status?: string; error_code?: string; message?: string; details?: Record<string, unknown> };
      const status = response.status;
      let errorCode = errObj.error_code || 'API_ERROR';
      let message = errObj.message || `Request failed with status ${status}`;

      if (status === 403) {
        errorCode = 'FORBIDDEN';
        message = message || `Access denied: Role '${activeRole}' does not have sufficient permissions.`;
      } else if (status === 401) {
        errorCode = 'UNAUTHORIZED';
      } else if (status === 404) {
        errorCode = 'NOT_FOUND';
      } else if (status === 400) {
        errorCode = 'VALIDATION_ERROR';
      } else if (status >= 500) {
        errorCode = 'SERVER_ERROR';
      }

      throw new ApiError(status, errorCode, message, errObj.details);
    }

    return data as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        408,
        'TIMEOUT',
        `The request timed out after ${timeoutMs / 1000}s. The server may still be processing intensive multi-agent work.`
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown network failure';
    throw new ApiError(0, 'NETWORK_ERROR', `Network connection failure: ${message}`);
  }
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
