'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Select } from '@ecom/ui';
import type { Category } from '@ecom/types';

export function ProductFilters({ categories }: { categories: Category[] }) {
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
    // Any filter change returns to the first page, otherwise page 4 of a new filter is empty.
    next.delete('page');
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    apply({
      search: String(form.get('search') ?? ''),
      minPrice: String(form.get('minPrice') ?? ''),
      maxPrice: String(form.get('maxPrice') ?? ''),
    });
  };

  const active = params.get('category') ?? '';

  return (
    <form onSubmit={onSubmit} className="space-y-5" aria-busy={pending}>
      <div>
        <label htmlFor="search" className="mb-1.5 block text-sm font-medium text-ink">
          Search
        </label>
        <Input id="search" name="search" type="search" defaultValue={params.get('search') ?? ''} placeholder="Name or SKU" />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Category</legend>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => apply({ category: '' })}
            aria-current={!active ? 'true' : undefined}
            className={`block w-full rounded px-2 py-1.5 text-left text-sm ${!active ? 'bg-accent-soft font-medium text-accent' : 'text-ink-soft hover:bg-surface-sunken'}`}
          >
            Everything
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => apply({ category: category.slug })}
              aria-current={active === category.slug ? 'true' : undefined}
              className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${
                active === category.slug ? 'bg-accent-soft font-medium text-accent' : 'text-ink-soft hover:bg-surface-sunken'
              }`}
            >
              {category.name}
              <span className="text-xs text-ink-muted">{category.productCount}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-2 text-sm font-medium text-ink">Price</legend>
        <Input name="minPrice" type="number" min="0" step="0.01" placeholder="From" defaultValue={params.get('minPrice') ?? ''} aria-label="Minimum price" />
        <Input name="maxPrice" type="number" min="0" step="0.01" placeholder="To" defaultValue={params.get('maxPrice') ?? ''} aria-label="Maximum price" />
      </fieldset>

      <div>
        <label htmlFor="sort" className="mb-1.5 block text-sm font-medium text-ink">
          Sort by
        </label>
        <Select
          id="sort"
          defaultValue={`${params.get('sort') ?? 'createdAt'}:${params.get('order') ?? 'desc'}`}
          onChange={(event) => {
            const [sort, order] = event.target.value.split(':');
            apply({ sort, order });
          }}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="price:asc">Price, low to high</option>
          <option value="price:desc">Price, high to low</option>
          <option value="name:asc">Name, A to Z</option>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          className="h-4 w-4 rounded-sm border-line-strong text-accent focus:ring-accent/40"
          defaultChecked={params.get('inStock') === 'true'}
          onChange={(event) => apply({ inStock: event.target.checked ? 'true' : '' })}
        />
        In stock only
      </label>

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          Apply
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => startTransition(() => router.push(pathname))}>
          Reset
        </Button>
      </div>
    </form>
  );
}
