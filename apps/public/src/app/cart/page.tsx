import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert, Card, CardBody, EmptyState, formatMoney } from '@ecom/ui';
import { CartLineControls } from '@/components/cart-line-controls';
import { FreeDeliveryNudge } from '@/components/free-delivery-nudge';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken } from '@/lib/session';
import type { Cart } from '@ecom/types';

export const metadata: Metadata = { title: 'Your basket', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login?redirectTo=%2Fcart');

  const cart = await gateway.get<Cart>(endpoints.storefront.cart, { token, cache: 'no-store' });
  const unavailable = cart.items.filter((line) => !line.available);

  return (
    <div className="shell py-10">
      <h1 className="font-display text-3xl text-ink">Your basket</h1>

      {cart.items.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Your basket is empty"
          description="Everything you add is held here until you are ready to order."
          action={
            <Link
              href="/products"
              className="inline-flex h-10 items-center rounded bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
            >
              Browse the catalogue
            </Link>
          }
        />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            {unavailable.length > 0 && (
              <Alert tone="caution" title="Some items need attention">
                {unavailable.length === 1
                  ? 'One item is no longer available in the quantity requested. Adjust or remove it to continue.'
                  : `${unavailable.length} items are no longer available in the quantities requested.`}
              </Alert>
            )}

            <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
              {cart.items.map((line) => (
                <li key={line.productId} className="flex flex-wrap gap-4 p-4 sm:flex-nowrap">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded border border-line bg-surface-sunken">
                    {line.imageUrl && (
                      <Image src={line.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-medium text-ink">
                          {line.slug ? <Link href={`/products/${line.slug}`}>{line.name}</Link> : line.name}
                        </h2>
                        {line.sku && <p className="text-xs text-ink-muted">{line.sku}</p>}
                      </div>
                      <p className="font-semibold text-ink">{formatMoney(line.lineTotal, cart.currency)}</p>
                    </div>

                    {!line.available && (
                      <p className="mt-1 text-sm text-critical">
                        {line.stockQuantity > 0
                          ? `Only ${line.stockQuantity} left — reduce the quantity to continue.`
                          : 'No longer available.'}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <CartLineControls
                        productId={line.productId}
                        quantity={line.quantity}
                        stockQuantity={line.stockQuantity}
                      />
                      <p className="text-sm text-ink-muted">
                        {formatMoney(line.unitPrice, cart.currency)} each
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside>
            <Card className="lg:sticky lg:top-24">
              <CardBody className="space-y-4">
                <h2 className="font-display text-lg text-ink">Summary</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Items</dt>
                    <dd className="text-ink">{cart.itemCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Estimated subtotal</dt>
                    <dd className="font-semibold text-ink">{formatMoney(cart.estimatedSubtotal, cart.currency)}</dd>
                  </div>
                </dl>

                <FreeDeliveryNudge subtotal={cart.estimatedSubtotal} currency={cart.currency} />

                <p className="text-xs text-ink-muted">
                  Delivery and tax are calculated when the order is placed. The figure above is indicative.
                </p>

                {cart.checkoutReady ? (
                  <Link
                    href="/checkout"
                    className="inline-flex h-11 w-full items-center justify-center rounded bg-accent text-sm font-medium text-accent-contrast hover:bg-accent-hover"
                  >
                    Continue to checkout
                  </Link>
                ) : (
                  <p className="rounded border border-caution/30 bg-caution/10 px-3 py-2 text-sm text-caution">
                    Resolve the items above to continue.
                  </p>
                )}

                <Link href="/products" className="block text-center text-sm text-accent underline underline-offset-4">
                  Keep browsing
                </Link>
              </CardBody>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
