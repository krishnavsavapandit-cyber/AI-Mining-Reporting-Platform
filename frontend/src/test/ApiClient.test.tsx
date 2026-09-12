import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from '@/services/apiClient';

describe('Centralized ApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('injects X-User-Role header into requests based on active role', async () => {
    localStorage.setItem('cil_user_role', 'OFFICER');

    let capturedHeaders: Headers | undefined;
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedHeaders = new Headers(init.headers);
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'success' }),
      });
    });

    const res = await apiClient.get<{ status: string }>('/api/test');
    expect(res.status).toBe('success');
    expect(capturedHeaders?.get('X-User-Role')).toBe('OFFICER');
  });

  it('maps 403 Forbidden errors with role denial details', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        status: 'error',
        error_code: 'FORBIDDEN',
        message: "Access denied: Role 'VIEWER' lacks permission for this action. Required: ADMIN.",
      }),
    });

    await expect(apiClient.delete('/api/documents/1')).rejects.toThrow(ApiError);
  });
});
