import type { Metadata } from 'next';
import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardBody, formatMoney } from '@ecom/ui';
import { CheckoutForm } from './checkout-form';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken } from '@/lib/session';
import type { Cart, CustomerProfile } from '@ecom/types';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login?redirectTo=%2Fcheckout');

  const [cart, profile] = await Promise.all([
    gateway.get<Cart>(endpoints.storefront.cart, { token, cache: 'no-store' }),
    gateway.get<CustomerProfile>(endpoints.storefront.profile, { token, cache: 'no-store' }),
  ]);

  if (cart.items.length === 0) redirect('/cart');

  return (
    <div className="shell py-10">
      <h1 className="font-display text-3xl text-ink">Checkout</h1>
      <p className="mt-1 text-sm text-ink-muted">
        No payment is taken online. A confirmed order is invoiced and settled separately.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* The key is generated once per rendered form, so a double submit is one order. */}
        <CheckoutForm profile={profile} idempotencyKey={randomUUID()} />

        <aside>
          <Card className="lg:sticky lg:top-24">
            <CardBody className="space-y-4">
              <h2 className="font-display text-lg text-ink">Your order</h2>
              <ul className="space-y-3">
                {cart.items.map((line) => (
                  <li key={line.productId} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate text-ink">{line.name}</span>
                      <span className="text-ink-muted">Quantity {line.quantity}</span>
                    </span>
                    <span className="shrink-0 font-medium text-ink">
                      {formatMoney(line.lineTotal, cart.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Estimated subtotal</span>
                  <span className="font-semibold text-ink">{formatMoney(cart.estimatedSubtotal, cart.currency)}</span>
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  Shipping and tax are added by our system when the order is confirmed.
                </p>
              </div>
              <Link href="/cart" className="block text-center text-sm text-accent underline underline-offset-4">
                Edit basket
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
