import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ApiError } from '@ecom/api-client';
import { Alert, Card, CardBody, DescriptionList, OrderStatusBadge, formatDateTime, formatMoney } from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { OrderActions } from './order-actions';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import type { Order } from '@ecom/types';

export const metadata: Metadata = { title: 'Order' };
export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const token = await getAccessToken();

  let order: Order;
  try {
    order = await gateway.get<Order>(endpoints.admin.order(id), { token, cache: 'no-store' });
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/orders" className="text-sm text-ink-muted hover:text-ink">
            ← All orders
          </Link>
          <h1 className="mt-1 font-display text-2xl text-ink">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-muted">Placed {formatDateTime(order.placedAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status === 'REJECTED' && order.rejectionReason && (
        <Alert tone="critical" title="Rejected" className="mb-6">
          {order.rejectionReason}
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-ink">Items</h2>
            </div>
            <CardBody>
              <ul className="divide-y divide-line">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-ink-muted">
                        {item.sku} · {formatMoney(item.unitPrice, order.currency)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-ink">{formatMoney(item.lineTotal, order.currency)}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
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

          <Card>
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-ink">History</h2>
            </div>
            <CardBody>
              <ol className="space-y-3">
                {order.history.map((event) => (
                  <li key={event.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    <span>
                      <span className="text-ink">
                        {event.fromStatus ? `${event.fromStatus} → ${event.toStatus}` : event.toStatus}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        {formatDateTime(event.createdAt)}
                        {event.changedByEmail ? ` · ${event.changedByEmail}` : ''}
                      </span>
                      {event.reason && <span className="block text-xs text-ink-muted">{event.reason}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <OrderActions
            orderId={order.id}
            status={order.status}
            internalNote={order.internalNote ?? ''}
            invoiceAvailable={Boolean(order.invoice?.available)}
            permissions={{
              confirm: can(user, 'order:confirm'),
              reject: can(user, 'order:reject'),
              update: can(user, 'order:update'),
              invoice: can(user, 'invoice:read'),
            }}
          />

          <Card>
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-ink">Customer</h2>
            </div>
            <CardBody className="space-y-4">
              <DescriptionList
                items={[
                  { term: 'Name', detail: order.customerName },
                  { term: 'Email', detail: order.customerEmail },
                  { term: 'Phone', detail: order.customerPhone ?? '—' },
                  { term: 'Invoice', detail: order.invoice?.invoiceNumber ?? 'Not yet issued' },
                ]}
              />
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">Delivery address</p>
                <address className="mt-1 text-sm not-italic text-ink-soft">
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
              </div>
              {order.customerNote && (
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">Customer note</p>
                  <p className="mt-1 rounded bg-surface-sunken px-3 py-2 text-sm text-ink-soft">{order.customerNote}</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
