import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { catalogueCache, endpoints, gateway } from '@/lib/api';
import { publicEnv } from '@/lib/env';
import type { Category, Product } from '@ecom/types';

export const revalidate = 120;

async function FeaturedProducts() {
  const page = await gateway.getPage<Product>(endpoints.storefront.products, {
    query: { limit: 8, sort: 'createdAt', order: 'desc', inStock: true },
    ...catalogueCache,
  });

  if (page.items.length === 0) {
    return <p className="text-sm text-ink-muted">The catalogue is being prepared. Please check back shortly.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {page.items.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}

async function CategoryStrip() {
  const categories = await gateway.get<Category[]>(endpoints.storefront.categories, catalogueCache);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products?category=${category.slug}`}
          className="group relative overflow-hidden rounded-xl border border-line bg-surface p-6 transition-shadow hover:shadow-raised"
        >
          {category.imageUrl && (
            <Image src={category.imageUrl} alt="" fill sizes="25vw" className="object-cover opacity-10" />
          )}
          <p className="font-display text-lg text-ink">{category.name}</p>
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{category.description}</p>
          <p className="mt-4 text-2xs uppercase tracking-wide text-accent">
            {category.productCount} {category.productCount === 1 ? 'piece' : 'pieces'}
          </p>
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="shell grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-brass">Since 2024</p>
            <h1 className="mt-3 text-4xl leading-[1.1] text-ink sm:text-5xl">
              Considered goods for work, listening and travel.
            </h1>
            <p className="prose-copy mt-5 text-base">
              A deliberately small catalogue. Every piece is chosen for how it holds up after a few years, not for how
              quickly it moves. Orders are placed without an online payment and settled separately.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex h-12 items-center rounded bg-accent px-6 text-sm font-medium text-accent-contrast shadow-subtle transition-colors hover:bg-accent-hover"
              >
                Browse the catalogue
              </Link>
              <Link
                href="/categories"
                className="inline-flex h-12 items-center rounded border border-line-strong px-6 text-sm text-ink transition-colors hover:bg-surface-sunken"
              >
                Shop by category
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface-sunken">
            <Image
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80"
              alt="A pair of studio headphones resting on a wooden desk"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="shell py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">New in</h2>
            <p className="mt-1 text-sm text-ink-muted">The most recent additions that are ready to ship.</p>
          </div>
          <Link href="/products" className="text-sm text-accent underline underline-offset-4 hover:text-accent-hover">
            See everything
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          }
        >
          <FeaturedProducts />
        </Suspense>
      </section>

      <section className="shell pb-16">
        <h2 className="mb-6 font-display text-2xl text-ink">Browse by category</h2>
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-surface-sunken" />}>
          <CategoryStrip />
        </Suspense>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="shell grid gap-8 py-12 sm:grid-cols-3">
          {[
            { title: 'Chosen slowly', copy: 'A short catalogue we can actually stand behind, reviewed every season.' },
            { title: 'Honest stock', copy: 'Stock counts are live. If it says two left, there are two left.' },
            { title: 'Settled separately', copy: `No card is taken online. ${publicEnv.siteName} invoices each confirmed order.` },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-lg text-ink">{item.title}</h3>
              <p className="prose-copy mt-1.5">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
