import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ApiError } from '@ecom/api-client';
import {
  Alert,
  Card,
  CardBody,
  DescriptionList,
  OrderStatusBadge,
  formatDateTime,
  formatMoney,
} from '@ecom/ui';
import { endpoints, gateway } from '@/lib/api';
import { requireUser } from '@/lib/session';
import type { Order } from '@ecom/types';

export const metadata: Metadata = { title: 'Order', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { token } = await requireUser();

  let order: Order;
  try {
    order = await gateway.get<Order>(endpoints.storefront.order(id), { token, cache: 'no-store' });
  } catch (error) {
    // A missing order and someone else's order are indistinguishable by design.
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      {query.placed === '1' && (
        <Alert tone="positive" title="Thank you — your order is in">
          We will confirm it shortly. No payment has been taken; an invoice follows confirmation.
        </Alert>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/account/orders" className="text-sm text-ink-muted hover:text-ink">
            ← All orders
          </Link>
          <h1 className="mt-1 font-display text-2xl text-ink">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-muted">Placed {formatDateTime(order.placedAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {order.invoice?.available && (
            <a
              href={`/account/orders/${order.id}/invoice`}
              className="inline-flex h-10 items-center rounded border border-line-strong px-4 text-sm text-ink hover:bg-surface-sunken"
            >
              Download invoice
            </a>
          )}
        </div>
      </div>

      {order.status === 'REJECTED' && order.rejectionReason && (
        <Alert tone="critical" title="This order was rejected">
          {order.rejectionReason}
        </Alert>
      )}

      <Card>
        <CardBody>
          <h2 className="mb-4 font-display text-lg text-ink">Items</h2>
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded border border-line bg-surface-sunken">
                  {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="flex flex-1 flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-ink-muted">
                      {item.sku} · {formatMoney(item.unitPrice, order.currency)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-ink">{formatMoney(item.lineTotal, order.currency)}</p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
            {[
              ['Subtotal', order.subtotal],
              ['Discount', order.discountTotal],
              ['Shipping', order.shippingTotal],
              ['Tax', order.taxTotal],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="text-ink">{formatMoney(String(value), order.currency)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="font-medium text-ink">Total</dt>
              <dd className="font-semibold text-ink">{formatMoney(order.grandTotal, order.currency)}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-3 font-display text-lg text-ink">Delivery</h2>
            <address className="text-sm not-italic text-ink-soft">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 && (
                <>
                  <br />
                  {order.shippingAddress.line2}
                </>
              )}
              <br />
              {order.shippingAddress.city} {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </address>
            {order.customerNote && (
              <p className="mt-3 rounded bg-surface-sunken px-3 py-2 text-sm text-ink-soft">{order.customerNote}</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-3 font-display text-lg text-ink">Progress</h2>
            <ol className="space-y-3">
              {order.history.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>
                    <span className="block text-ink">{event.toStatus.toLowerCase().replace('_', ' ')}</span>
                    <span className="block text-xs text-ink-muted">{formatDateTime(event.createdAt)}</span>
                    {event.reason && <span className="block text-xs text-ink-muted">{event.reason}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <DescriptionList
            items={[
              { term: 'Order number', detail: order.orderNumber },
              { term: 'Invoice', detail: order.invoice?.invoiceNumber ?? 'Issued once confirmed' },
              { term: 'Payment', detail: 'Settled separately — no online payment taken' },
              { term: 'Last updated', detail: formatDateTime(order.updatedAt) },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
