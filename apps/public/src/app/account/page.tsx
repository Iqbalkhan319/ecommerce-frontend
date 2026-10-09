import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardBody, OrderStatusBadge, formatDate, formatMoney } from '@ecom/ui';
import { ProfileForm } from './profile-form';
import { endpoints, gateway } from '@/lib/api';
import { requireUser } from '@/lib/session';
import type { CustomerProfile, Order } from '@ecom/types';

export const metadata: Metadata = { title: 'Your account', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const { token } = await requireUser();
  const [profile, orders] = await Promise.all([
    gateway.get<CustomerProfile>(endpoints.storefront.profile, { token, cache: 'no-store' }),
    gateway.getPage<Order>(endpoints.storefront.orders, { token, query: { limit: 3 }, cache: 'no-store' }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Overview</h1>
        <p className="mt-1 text-sm text-ink-muted">Your details and your most recent orders.</p>
      </div>

      <Card>
        <CardBody>
          <h2 className="mb-4 font-display text-lg text-ink">Your details</h2>
          <ProfileForm profile={profile} />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Recent orders</h2>
            <Link href="/account/orders" className="text-sm text-accent underline underline-offset-4">
              View all
            </Link>
          </div>

          {orders.items.length === 0 ? (
            <p className="text-sm text-ink-muted">You have not placed an order yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {orders.items.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/account/orders/${order.id}`} className="font-medium text-ink hover:text-accent">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      {formatDate(order.placedAt)} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-semibold text-ink">{formatMoney(order.grandTotal, order.currency)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
