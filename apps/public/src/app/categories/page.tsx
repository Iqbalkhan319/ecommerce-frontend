import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { EmptyState } from '@ecom/ui';
import { catalogueCache, endpoints, gateway } from '@/lib/api';
import type { Category } from '@ecom/types';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse the catalogue by category.',
};

export default async function CategoriesPage() {
  const categories = await gateway.get<Category[]>(endpoints.storefront.categories, catalogueCache);

  return (
    <div className="shell py-10">
      <h1 className="font-display text-3xl text-ink">Categories</h1>
      <p className="mt-1 text-sm text-ink-muted">Four groups, kept deliberately small.</p>

      {categories.length === 0 ? (
        <EmptyState className="mt-8" title="No categories yet" description="The catalogue is still being prepared." />
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-raised"
            >
              <div className="relative aspect-[16/9] bg-surface-sunken">
                {category.imageUrl && (
                  <Image src={category.imageUrl} alt="" fill sizes="33vw" className="object-cover" />
                )}
              </div>
              <div className="p-5">
                <h2 className="font-display text-lg text-ink">{category.name}</h2>
                {category.description && <p className="prose-copy mt-1.5 line-clamp-2">{category.description}</p>}
                <p className="mt-3 text-2xs uppercase tracking-wide text-accent">
                  {category.productCount} {category.productCount === 1 ? 'piece' : 'pieces'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
