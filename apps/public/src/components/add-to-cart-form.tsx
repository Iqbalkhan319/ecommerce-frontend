'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, QuantityStepper, useToast } from '@ecom/ui';
import { addToCartAction } from '@/lib/actions/cart';
import { initialCartState } from '@/lib/actions/cart-state';

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" loading={pending} disabled={disabled} className="flex-1 sm:flex-none sm:px-10">
      {disabled ? 'Out of stock' : 'Add to basket'}
    </Button>
  );
}

export function AddToCartForm({
  productId,
  slug,
  stockQuantity,
  maxQuantity = 20,
}: {
  productId: string;
  slug: string;
  stockQuantity: number;
  maxQuantity?: number;
}) {
  const [state, formAction] = useActionState(addToCartAction, initialCartState);
  const [quantity, setQuantity] = React.useState(1);
  const toast = useToast();
  const seen = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (state.status === 'idle' || !state.message || state.message === seen.current) return;
    seen.current = state.message;
    if (state.status === 'success') toast.success(state.message);
    else toast.error('Could not add to basket', state.message);
  }, [state, toast]);

  const soldOut = stockQuantity <= 0;
  const max = Math.max(1, Math.min(stockQuantity, maxQuantity));

  return (
    <form action={formAction} className="mt-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="slug" value={slug} />

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          max={max}
          name="quantity"
          disabled={soldOut}
          onChange={setQuantity}
          className="shrink-0"
        />
        <SubmitButton disabled={soldOut} />
      </div>

      {!soldOut && stockQuantity <= max && (
        <p className="mt-2 text-2xs text-ink-muted">
          {stockQuantity === 1 ? 'Last one in stock' : `${stockQuantity} in stock`}
        </p>
      )}

      {state.status === 'error' && state.message && (
        <p role="alert" className="mt-2 text-sm font-medium text-critical">
          {state.message}
        </p>
      )}
    </form>
  );
}
