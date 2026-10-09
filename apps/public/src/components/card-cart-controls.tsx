'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Button, QuantityStepper, useToast } from '@ecom/ui';
import { addToCartAction } from '@/lib/actions/cart';
import { initialCartState } from '@/lib/actions/cart-state';

const MAX_PER_ORDER = 20;

/**
 * Quantity and add-to-basket directly on a product card.
 *
 * The card makes its whole surface a link, so these controls must sit above that
 * overlay and stop clicks from bubbling into it: otherwise every tap on "+" would
 * navigate to the product instead of changing the quantity.
 */
export function CardCartControls({
  productId,
  slug,
  stockQuantity,
}: {
  productId: string;
  slug: string;
  stockQuantity: number;
}) {
  const [quantity, setQuantity] = React.useState(1);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const soldOut = stockQuantity <= 0;
  const max = Math.max(1, Math.min(stockQuantity, MAX_PER_ORDER));

  const add = () => {
    startTransition(async () => {
      const data = new FormData();
      data.set('productId', productId);
      data.set('slug', slug);
      data.set('quantity', String(quantity));
      const result = await addToCartAction(initialCartState, data);
      if (result.status === 'error') toast.error('Could not add to basket', result.message);
      else {
        toast.success(quantity === 1 ? 'Added to your basket.' : `${quantity} added to your basket.`);
        setQuantity(1);
      }
    });
  };

  return (
    <div
      className="relative z-10 mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
      onClick={(event) => event.stopPropagation()}
    >
      <QuantityStepper
        value={quantity}
        max={max}
        size="sm"
        disabled={soldOut || pending}
        busy={pending}
        onChange={setQuantity}
        className="self-start sm:self-auto"
      />
      <Button
        size="sm"
        onClick={add}
        loading={pending}
        disabled={soldOut}
        className="w-full sm:flex-1"
        aria-label={soldOut ? 'Out of stock' : `Add ${quantity} to basket`}
      >
        {soldOut ? (
          'Out of stock'
        ) : (
          <>
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add to basket</span>
          </>
        )}
      </Button>
    </div>
  );
}
