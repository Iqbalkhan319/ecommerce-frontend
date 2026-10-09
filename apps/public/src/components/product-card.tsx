import Image from 'next/image';
import Link from 'next/link';
import { Badge, formatMoney } from '@ecom/ui';
import { CardCartControls } from './card-cart-controls';
import type { Product } from '@ecom/types';

function savingsPercent(price: string, compareAt: string): number {
  const now = Number(price);
  const was = Number(compareAt);
  if (!Number.isFinite(now) || !Number.isFinite(was) || was <= now) return 0;
  return Math.round(((was - now) / was) * 100);
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const image = product.images.find((entry) => entry.isPrimary) ?? product.images[0];
  const onSale = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
  const saved = onSale ? savingsPercent(product.price, product.compareAtPrice!) : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-entrance group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-ink-muted">No image</div>
        )}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {saved > 0 && <Badge tone="accent">Save {saved}%</Badge>}
          {!product.inStock && <Badge tone="critical">Out of stock</Badge>}
          {product.inStock && product.isLowStock && <Badge tone="caution">Only {product.stockQuantity} left</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-2xs uppercase tracking-wide text-ink-muted">{product.category.name}</p>
        <h3 className="mt-1 font-display text-base leading-snug text-ink">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{product.shortDescription}</p>
        )}

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-ink">
              {formatMoney(product.price, product.currency)}
            </span>
            {onSale && (
              <span className="text-sm text-ink-muted line-through">
                {formatMoney(product.compareAtPrice!, product.currency)}
              </span>
            )}
          </div>

          <CardCartControls productId={product.id} slug={product.slug} stockQuantity={product.stockQuantity} />
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="aspect-[4/5] animate-pulse bg-surface-sunken" />
      <div className="space-y-2 p-4">
        <div className="h-2.5 w-16 animate-pulse rounded bg-surface-sunken" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface-sunken" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-sunken" />
        <div className="h-5 w-24 animate-pulse rounded bg-surface-sunken" />
        <div className="h-9 w-full animate-pulse rounded-lg bg-surface-sunken" />
      </div>
    </div>
  );
}
