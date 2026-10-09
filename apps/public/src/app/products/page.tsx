import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState, Pagination } from '@ecom/ui';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { ProductFilters } from '@/components/product-filters';
import { catalogueCache, endpoints, gateway } from '@/lib/api';
import type { Category, Product } from '@ecom/types';

export const metadata: Metadata = {
  title: 'All products',
  description: 'Browse the full catalogue: audio, workspace, travel and lighting.',
};

interface SearchParams {
  page?: string;
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  sort?: string;
  order?: string;
}

function buildQuery(params: SearchParams, categories: Category[]) {
  const category = categories.find((entry) => entry.slug === params.category);
  return {
    page: Number(params.page ?? 1),
    limit: 12,
    search: params.search,
    categoryId: category?.id,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    inStock: params.inStock === 'true' ? true : undefined,
    sort: params.sort ?? 'createdAt',
    order: (params.order as 'asc' | 'desc') ?? 'desc',
  };
}

async function ProductGrid({ searchParams }: { searchParams: SearchParams }) {
  const categories = await gateway.get<Category[]>(endpoints.storefront.categories, catalogueCache);
  const query = buildQuery(searchParams, categories);
  const page = await gateway.getPage<Product>(endpoints.storefront.products, { query, ...catalogueCache });

  if (page.items.length === 0) {
    return (
      <EmptyState
        title="Nothing matches those filters"
        description="Try widening the price range, or clearing the search term."
      />
    );
  }

  const buildHref = (target: number) => {
    const next = new URLSearchParams(Object.entries(searchParams).filter(([, value]) => value) as [string, string][]);
    next.set('page', String(target));
    return `/products?${next.toString()}`;
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
        {page.items.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 3} />
        ))}
      </div>
      <Pagination
        page={page.meta.page}
        totalPages={page.meta.totalPages}
        totalItems={page.meta.totalItems}
        buildHref={buildHref}
      />
    </>
  );
}

async function FilterPanel() {
  const categories = await gateway.get<Category[]>(endpoints.storefront.categories, catalogueCache);
  return <ProductFilters categories={categories} />;
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  return (
    <div className="shell py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">
          {params.search ? `Results for “${params.search}”` : 'All products'}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Prices include applicable tax. Stock counts update in real time.</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
        <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface-sunken" />}>
            <FilterPanel />
          </Suspense>
        </aside>

        <div>
          <Suspense
            key={JSON.stringify(params)}
            fallback={
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            }
          >
            <ProductGrid searchParams={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
