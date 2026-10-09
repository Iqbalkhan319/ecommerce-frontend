import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, OrderStatusBadge, Pagination, TableShell, Td, Th, formatDate, formatMoney } from '@ecom/ui';
import { endpoints, gateway } from '@/lib/api';
import { requireUser } from '@/lib/session';
import type { Order } from '@ecom/types';

export const metadata: Metadata = { title: 'Your orders', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const { token } = await requireUser();
  const page = await gateway.getPage<Order>(endpoints.storefront.orders, {
    token,
    query: { page: Number(params.page ?? 1), limit: 10 },
    cache: 'no-store',
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Your orders</h1>
      <p className="mt-1 text-sm text-ink-muted">Every order you have placed, newest first.</p>

      {page.items.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No orders yet"
          description="When you place your first order it will appear here, with its invoice."
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
        <div className="mt-6">
          <TableShell>
            <caption className="sr-only">Your order history</caption>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Placed</Th>
                <Th>Items</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((order) => (
                <tr key={order.id} className="hover:bg-surface-sunken">
                  <Td>
                    <Link href={`/account/orders/${order.id}`} className="font-medium text-ink hover:text-accent">
                      {order.orderNumber}
                    </Link>
                  </Td>
                  <Td className="text-ink-muted">{formatDate(order.placedAt)}</Td>
                  <Td className="text-ink-muted">{order.itemCount}</Td>
                  <Td>
                    <OrderStatusBadge status={order.status} />
                  </Td>
                  <Td className="text-right font-semibold">{formatMoney(order.grandTotal, order.currency)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination
            page={page.meta.page}
            totalPages={page.meta.totalPages}
            totalItems={page.meta.totalItems}
            buildHref={(target) => `/account/orders?page=${target}`}
          />
        </div>
      )}
    </div>
  );
}
