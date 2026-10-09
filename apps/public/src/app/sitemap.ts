import type { MetadataRoute } from 'next';
import { endpoints, gateway } from '@/lib/api';
import { publicEnv } from '@/lib/env';
import type { Category, Product } from '@ecom/types';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  try {
    const [products, categories] = await Promise.all([
      gateway.getPage<Product>(endpoints.storefront.products, { query: { limit: 100 }, revalidateSeconds: 3600 }),
      gateway.get<Category[]>(endpoints.storefront.categories, { revalidateSeconds: 3600 }),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: `${base}/products?category=${category.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
      ...products.items.map((product) => ({
        url: `${base}/products/${product.slug}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // A catalogue outage must not break the sitemap entirely.
    return staticRoutes;
  }
}
