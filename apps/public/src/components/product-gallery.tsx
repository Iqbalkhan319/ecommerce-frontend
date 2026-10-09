'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@ecom/ui';
import { ImageMagnifier } from './image-magnifier';
import type { ProductImage } from '@ecom/types';

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const ordered = React.useMemo(() => {
    const primary = images.findIndex((entry) => entry.isPrimary);
    if (primary <= 0) return images;
    return [images[primary], ...images.filter((_, index) => index !== primary)];
  }, [images]);

  const [active, setActive] = React.useState(0);
  const current = ordered[active];

  if (!current) {
    return (
      <div className="grid aspect-square place-items-center rounded-2xl border border-line bg-surface-sunken text-sm text-ink-muted">
        No image available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ImageMagnifier src={current.url} alt={current.altText ?? productName} priority />

      {ordered.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {ordered.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${ordered.length}`}
              aria-current={index === active}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg border transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                index === active
                  ? 'border-accent ring-1 ring-accent'
                  : 'border-line opacity-75 hover:opacity-100 hover:border-line-strong',
              )}
            >
              <Image src={entry.url} alt="" fill sizes="15vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
