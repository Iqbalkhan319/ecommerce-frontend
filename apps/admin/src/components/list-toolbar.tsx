'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Select } from '@ecom/ui';

export interface FilterOption {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

// One search-and-filter bar for every table, so the tables behave consistently and the
// URL always describes exactly what is on screen (shareable, bookmarkable, refreshable).
export function ListToolbar({
  searchPlaceholder = 'Search',
  filters = [],
  action,
}: {
  searchPlaceholder?: string;
  filters?: FilterOption[];
  action?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const apply = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page');
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3" aria-busy={pending}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply({ search: String(new FormData(event.currentTarget).get('search') ?? '') });
        }}
        className="flex items-end gap-2"
      >
        <div>
          <label htmlFor="list-search" className="sr-only">
            {searchPlaceholder}
          </label>
          <Input
            id="list-search"
            name="search"
            type="search"
            placeholder={searchPlaceholder}
            defaultValue={params.get('search') ?? ''}
            className="w-56"
          />
        </div>
        <Button type="submit" variant="secondary" size="md" loading={pending}>
          Search
        </Button>
      </form>

      {filters.map((filter) => (
        <div key={filter.name}>
          <label htmlFor={`filter-${filter.name}`} className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-ink-muted">
            {filter.label}
          </label>
          <Select
            id={`filter-${filter.name}`}
            defaultValue={params.get(filter.name) ?? ''}
            onChange={(event) => apply({ [filter.name]: event.target.value })}
            className="w-44"
          >
            <option value="">All</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ))}

      {params.size > 0 && (
        <Button variant="ghost" size="md" onClick={() => startTransition(() => router.push(pathname))}>
          Clear
        </Button>
      )}

      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
