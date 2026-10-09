import { describe, expect, it } from 'vitest';
import { buildHref, parseListParams } from '../src/lib/query';

describe('list parameters', () => {
  it('applies sensible defaults', () => {
    const params = parseListParams({});
    expect(params).toMatchObject({ page: 1, limit: 20, order: 'desc' });
  });

  it('rejects a page size a client should not be able to request', () => {
    expect(parseListParams({ limit: '5000' }).limit).toBe(20);
    expect(parseListParams({ limit: '-3' }).limit).toBe(20);
    expect(parseListParams({ limit: '50' }).limit).toBe(50);
  });

  it('ignores a nonsensical page number', () => {
    expect(parseListParams({ page: 'abc' }).page).toBe(1);
    expect(parseListParams({ page: '0' }).page).toBe(1);
    expect(parseListParams({ page: '7' }).page).toBe(7);
  });

  it('trims a search term and drops an empty one', () => {
    expect(parseListParams({ search: '  desk  ' }).search).toBe('desk');
    expect(parseListParams({ search: '   ' }).search).toBeUndefined();
  });

  it('builds a href without empty parameters', () => {
    expect(buildHref('/orders', { page: 2, status: 'PENDING', search: undefined })).toBe('/orders?page=2&status=PENDING');
    expect(buildHref('/orders', {})).toBe('/orders');
  });
});
