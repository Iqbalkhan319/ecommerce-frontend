import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError } from '@ecom/api-client';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('ApiClient', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('unwraps the success envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { id: 'p1' } })));
    const client = new ApiClient('http://gateway.test');
    await expect(client.get('api/v1/public/catalog/products/x')).resolves.toEqual({ id: 'p1' });
  });

  it('keeps page metadata alongside the collection', async () => {
    const meta = { page: 2, limit: 10, totalItems: 25, totalPages: 3, hasNextPage: true, hasPreviousPage: true };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, data: [{ id: 'a' }], meta })));
    const client = new ApiClient('http://gateway.test');
    const page = await client.getPage('api/v1/public/catalog/products');
    expect(page.items).toHaveLength(1);
    expect(page.meta).toEqual(meta);
  });

  it('turns an error envelope into a typed ApiError with field errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              requestId: 'req-1',
              timestamp: new Date().toISOString(),
              details: [{ field: 'email', constraints: ['A valid email address is required'] }],
            },
          },
          422,
        ),
      ),
    );

    const client = new ApiClient('http://gateway.test');
    await expect(client.post('api/v1/auth/register', {})).rejects.toSatisfy((error: unknown) => {
      const apiError = error as ApiError;
      expect(apiError).toBeInstanceOf(ApiError);
      expect(apiError.isValidation).toBe(true);
      expect(apiError.code).toBe('VALIDATION_ERROR');
      expect(apiError.requestId).toBe('req-1');
      expect(apiError.fieldErrors.email).toBe('A valid email address is required');
      return true;
    });
  });

  it('flags an unauthenticated response so the caller can redirect to sign-in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { success: false, error: { code: 'UNAUTHENTICATED', message: 'Token required', requestId: 'r', timestamp: '' } },
          401,
        ),
      ),
    );
    const client = new ApiClient('http://gateway.test');
    await expect(client.get('api/v1/public/cart')).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  it('reports a network failure as a service error rather than throwing raw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')));
    const client = new ApiClient('http://gateway.test');
    await expect(client.get('api/v1/public/catalog/categories')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('sends the bearer token and idempotency key when supplied', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { id: 'o1' } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new ApiClient('http://gateway.test');
    await client.post('api/v1/public/orders', { note: 'x' }, { token: 'jwt-token', idempotencyKey: 'key-1' });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBe('Bearer jwt-token');
    expect(init.headers['idempotency-key']).toBe('key-1');
  });

  it('appends only defined query parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new ApiClient('http://gateway.test');
    await client.getPage('api/v1/public/catalog/products', {
      query: { page: 1, search: undefined, inStock: true, category: '' },
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('page=1');
    expect(url).toContain('inStock=true');
    expect(url).not.toContain('search');
    expect(url).not.toContain('category');
  });
});
