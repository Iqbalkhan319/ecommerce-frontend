'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Category } from '@ecom/types';
import { Dialog, IconButton } from '@ecom/ui';

export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <IconButton label="Open the menu" className="md:hidden" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} title="Browse">
        <nav aria-label="Mobile" className="space-y-1">
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="block rounded px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-sunken"
          >
            All products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded px-3 py-2.5 text-sm text-ink-soft hover:bg-surface-sunken hover:text-ink"
            >
              {category.name}
              <span className="text-xs text-ink-muted">{category.productCount}</span>
            </Link>
          ))}
        </nav>
      </Dialog>
    </>
  );
}
