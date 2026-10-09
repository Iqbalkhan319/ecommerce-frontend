import Link from 'next/link';
import { BrandMark } from '@ecom/ui';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { brand } from '@/lib/env';
import { ThemeToggle } from './theme-toggle';
import { AccountMenu } from './account-menu';
import { MobileNav } from './mobile-nav';
import type { Cart, Category } from '@ecom/types';

async function loadCartCount(): Promise<number> {
  const token = await getAccessToken();
  if (!token) return 0;
  try {
    const cart = await gateway.get<Cart>(endpoints.storefront.cart, { token, cache: 'no-store' });
    return cart.itemCount;
  } catch {
    return 0;
  }
}

async function loadCategories(): Promise<Category[]> {
  try {
    return await gateway.get<Category[]>(endpoints.storefront.categories, {
      revalidateSeconds: 300,
      tags: ['catalogue'],
    });
  } catch {
    return [];
  }
}

export async function SiteHeader() {
  const [user, cartCount, categories] = await Promise.all([getCurrentUser(), loadCartCount(), loadCategories()]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="shell flex h-16 items-center gap-4">
        <MobileNav categories={categories} />

        <Link href="/" aria-label={`${brand.name} home`}>
          <BrandMark
            identity={brand}
            textClassName="font-display text-xl tracking-tight text-ink"
            logoClassName="h-9"
            adornment={<span className="h-1.5 w-1.5 rounded-full bg-brass" aria-hidden="true" />}
          />
        </Link>

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-6 md:flex">
          <Link href="/products" className="text-sm text-ink-soft transition-colors hover:text-ink">
            All products
          </Link>
          {categories.slice(0, 4).map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <form action="/products" className="hidden sm:block">
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <input
              id="header-search"
              name="search"
              type="search"
              placeholder="Search"
              className="h-9 w-40 rounded border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:w-56 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
          </form>

          <ThemeToggle />

          <Link
            href="/cart"
            className="relative inline-flex h-9 items-center gap-2 rounded px-3 text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            Basket
            {cartCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-2xs font-semibold text-accent-contrast">
                {cartCount}
              </span>
            )}
            <span className="sr-only">{cartCount === 1 ? '1 item in basket' : `${cartCount} items in basket`}</span>
          </Link>

          <AccountMenu user={user} />
        </div>
      </div>
    </header>
  );
}
