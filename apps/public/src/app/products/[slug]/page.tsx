import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError } from '@ecom/api-client';
import { Badge, DescriptionList, StockBadge, formatMoney } from '@ecom/ui';
import { AddToCartForm } from '@/components/add-to-cart-form';
import { ProductGallery } from '@/components/product-gallery';
import { catalogueCache, endpoints, gateway } from '@/lib/api';
import { delivery, publicEnv } from '@/lib/env';
import type { Product } from '@ecom/types';

async function loadProduct(slug: string): Promise<Product | null> {
  try {
    return await gateway.get<Product>(endpoints.storefront.product(slug), catalogueCache);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: 'Product not found' };

  const image = product.images.find((entry) => entry.isPrimary) ?? product.images[0];
  return {
    title: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: image ? [{ url: image.url, alt: image.altText ?? product.name }] : undefined,
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const onSale = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);

  // Structured data helps the product surface correctly in search results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    sku: product.sku,
    image: product.images.map((entry) => entry.url),
    category: product.category.name,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${publicEnv.siteUrl}/products/${product.slug}`,
    },
  };

  return (
    <div className="shell py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/products" className="hover:text-ink">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <p className="text-2xs uppercase tracking-wide text-ink-muted">{product.category.name}</p>
          <h1 className="mt-1.5 font-display text-3xl text-ink">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold tracking-tight text-ink">
              {formatMoney(product.price, product.currency)}
            </span>
            {onSale && (
              <>
                <span className="text-lg text-ink-muted line-through">
                  {formatMoney(product.compareAtPrice!, product.currency)}
                </span>
                <Badge tone="accent">
                  Save {formatMoney(Number(product.compareAtPrice) - Number(product.price), product.currency)}
                </Badge>
              </>
            )}
          </div>

          <div className="mt-3">
            <StockBadge stock={product.stockQuantity} threshold={product.lowStockThreshold} />
          </div>

          {product.shortDescription && <p className="mt-5 text-base text-ink-soft">{product.shortDescription}</p>}

          <AddToCartForm productId={product.id} slug={product.slug} stockQuantity={product.stockQuantity} />

          <dl className="mt-6 grid gap-3 rounded-xl border border-line bg-surface-sunken/60 p-4 sm:grid-cols-3">
            <div>
              <dt className="text-2xs uppercase tracking-wide text-ink-muted">Delivery</dt>
              <dd className="mt-0.5 text-sm text-ink">
                Flat {formatMoney(delivery.flatRate, product.currency)}, free over{' '}
                {formatMoney(delivery.freeThreshold, product.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-2xs uppercase tracking-wide text-ink-muted">Payment</dt>
              <dd className="mt-0.5 text-sm text-ink">Settled on delivery</dd>
            </div>
            <div>
              <dt className="text-2xs uppercase tracking-wide text-ink-muted">Returns</dt>
              <dd className="mt-0.5 text-sm text-ink">7 days, unused</dd>
            </div>
          </dl>

          {product.description && (
            <div className="mt-10 border-t border-line pt-6">
              <h2 className="font-display text-lg text-ink">Details</h2>
              <p className="prose-copy mt-2">{product.description}</p>
            </div>
          )}

          <div className="mt-8 border-t border-line pt-6">
            <DescriptionList
              items={[
                { term: 'SKU', detail: product.sku },
                { term: 'Category', detail: product.category.name },
                ...(product.weightGrams ? [{ term: 'Weight', detail: `${product.weightGrams} g` }] : []),
                { term: 'Availability', detail: product.inStock ? `${product.stockQuantity} in stock` : 'Out of stock' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
