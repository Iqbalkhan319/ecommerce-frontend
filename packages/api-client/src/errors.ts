import type { ApiErrorBody } from '@ecom/types';

// A single error type for everything the gateway can return, so UI code can branch on a
// stable machine-readable code instead of parsing messages.
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string;
  readonly details: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.requestId = body.requestId;
    this.details = body.details;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidation(): boolean {
    return this.status === 422 || this.code === 'VALIDATION_ERROR';
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  // Field-level messages produced by the backend validation pipe, ready for a form.
  get fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.details)) return {};
    const entries: Record<string, string> = {};
    for (const detail of this.details as Array<{ field?: string; constraints?: string[] }>) {
      if (detail.field && detail.constraints?.length) entries[detail.field] = detail.constraints[0];
    }
    return entries;
  }

  static network(message: string): ApiError {
    return new ApiError(503, {
      code: 'NETWORK_ERROR',
      message,
      requestId: 'client',
      timestamp: new Date().toISOString(),
    });
  }
}
