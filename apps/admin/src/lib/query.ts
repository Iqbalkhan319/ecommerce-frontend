// Shared parsing for list-page search parameters, so every table behaves the same way.
export interface ListParams {
  page: number;
  limit: number;
  search?: string;
  order: 'asc' | 'desc';
  sort?: string;
  [key: string]: string | number | undefined;
}

export function parseListParams(
  params: Record<string, string | undefined>,
  defaults: Partial<ListParams> = {},
): ListParams {
  const page = Number.parseInt(params.page ?? '1', 10);
  const limit = Number.parseInt(params.limit ?? String(defaults.limit ?? 20), 10);
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20,
    search: params.search?.trim() || undefined,
    order: params.order === 'asc' ? 'asc' : 'desc',
    sort: params.sort ?? defaults.sort,
  };
}

export function buildHref(base: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== null) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}
