import type { ApiResponse, Page, PageMeta } from '@ecom/types';
import { ApiError } from './errors';

export interface RequestOptions {
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  cache?: RequestCache;
  revalidateSeconds?: number;
  tags?: string[];
}

export interface Result<T> {
  data: T;
  meta?: PageMeta;
}

const DEFAULT_TIMEOUT_MS = 12000;

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<Result<T>> {
    const url = buildUrl(this.baseUrl, path, options.query);
    const timeout = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          accept: 'application/json',
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
          ...(options.idempotencyKey ? { 'idempotency-key': options.idempotencyKey } : {}),
          ...options.headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
        cache: options.cache,
        ...(options.revalidateSeconds !== undefined || options.tags
          ? { next: { revalidate: options.revalidateSeconds, tags: options.tags } }
          : {}),
      } as RequestInit);
    } catch (error) {
      throw ApiError.network(
        (error as Error).name === 'TimeoutError'
          ? 'The service did not respond in time. Please try again.'
          : 'The service could not be reached. Please check your connection and try again.',
      );
    }

    if (response.status === 204) return { data: undefined as T };

    const text = await response.text();
    let payload: ApiResponse<T> | undefined;
    try {
      payload = text ? (JSON.parse(text) as ApiResponse<T>) : undefined;
    } catch {
      throw ApiError.network('The service returned an unreadable response.');
    }

    if (!response.ok || !payload || payload.success === false) {
      const failure = payload && payload.success === false ? payload.error : undefined;
      throw new ApiError(response.status, {
        code: failure?.code ?? 'UNEXPECTED_ERROR',
        message: failure?.message ?? `Request failed with status ${response.status}`,
        requestId: failure?.requestId ?? 'unknown',
        timestamp: failure?.timestamp ?? new Date().toISOString(),
        details: failure?.details,
      });
    }

    return { data: payload.data, meta: payload.meta as PageMeta | undefined };
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return (await this.request<T>('GET', path, undefined, options)).data;
  }

  // Paginated endpoints return the collection in `data` and the page metadata in `meta`.
  async getPage<T>(path: string, options?: RequestOptions): Promise<Page<T>> {
    const result = await this.request<T[]>('GET', path, undefined, options);
    return {
      items: result.data ?? [],
      meta: result.meta ?? {
        page: 1,
        limit: 0,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return (await this.request<T>('POST', path, body, options)).data;
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return (await this.request<T>('PATCH', path, body, options)).data;
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return (await this.request<T>('PUT', path, body, options)).data;
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return (await this.request<T>('DELETE', path, undefined, options)).data;
  }

  // Used for the invoice PDF, which is a binary stream rather than an envelope.
  async getBinary(path: string, options: RequestOptions = {}): Promise<{ body: ArrayBuffer; contentType: string; filename: string }> {
    const url = buildUrl(this.baseUrl, path, options.query);
    const response = await fetch(url, {
      headers: {
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
      signal: AbortSignal.timeout(options.timeoutMs ?? 20000),
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      let failure: { error?: { code?: string; message?: string; requestId?: string } } | undefined;
      try {
        failure = text ? JSON.parse(text) : undefined;
      } catch {
        failure = undefined;
      }
      throw new ApiError(response.status, {
        code: failure?.error?.code ?? 'DOWNLOAD_FAILED',
        message: failure?.error?.message ?? 'The document could not be downloaded',
        requestId: failure?.error?.requestId ?? 'unknown',
        timestamp: new Date().toISOString(),
      });
    }

    const disposition = response.headers.get('content-disposition') ?? '';
    const match = /filename="?([^"]+)"?/.exec(disposition);
    return {
      body: await response.arrayBuffer(),
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
      filename: match?.[1] ?? 'document.pdf',
    };
  }
}

export function createApiClient(baseUrl: string): ApiClient {
  return new ApiClient(baseUrl);
}
