'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Button, IconButton, useToast } from '@ecom/ui';
import { removeCartItemAction, updateCartItemAction } from '@/lib/actions/cart';

export function CartLineControls({
  productId,
  quantity,
  stockQuantity,
}: {
  productId: string;
  quantity: number;
  stockQuantity: number;
}) {
  const [pending, startTransition] = useTransition();
  // Optimistic in the narrow sense: the number moves immediately, and is reconciled by
  // the server response. Anything that touches stock or money is never optimistic.
  const [shown, setShown] = React.useState(quantity);
  const toast = useToast();

  React.useEffect(() => setShown(quantity), [quantity]);

  const change = (next: number) => {
    if (next < 1 || next > Math.min(stockQuantity, 20)) return;
    setShown(next);
    startTransition(async () => {
      const result = await updateCartItemAction(productId, next);
      if (result.status === 'error') {
        setShown(quantity);
        toast.error('Basket not updated', result.message);
      }
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await removeCartItemAction(productId);
      if (result.status === 'error') toast.error('Could not remove the item', result.message);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center rounded border border-line-strong" aria-busy={pending}>
        <IconButton label="Reduce quantity" onClick={() => change(shown - 1)} disabled={pending || shown <= 1}>
          <span aria-hidden="true">−</span>
        </IconButton>
        <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">
          {shown}
        </span>
        <IconButton
          label="Increase quantity"
          onClick={() => change(shown + 1)}
          disabled={pending || shown >= Math.min(stockQuantity, 20)}
        >
          <span aria-hidden="true">+</span>
        </IconButton>
      </div>
      <Button variant="link" onClick={remove} disabled={pending} className="text-sm">
        Remove
      </Button>
    </div>
  );
}
