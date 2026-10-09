import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Card,
  CardBody,
  EmptyState,
  OrderStatusBadge,
  Pagination,
  TableShell,
  Td,
  Th,
  formatDateTime,
  formatMoney,
} from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { ListToolbar } from '@/components/list-toolbar';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { buildHref, parseListParams } from '@/lib/query';
import type { Order } from '@ecom/types';

export const metadata: Metadata = { title: 'Orders' };
export const dynamic = 'force-dynamic';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REJECTED', 'CANCELLED'];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const list = parseListParams(params, { sort: 'placedAt' });
  const token = await getAccessToken();

  const page = await gateway.getPage<Order>(endpoints.admin.orders, {
    token,
    cache: 'no-store',
    query: { ...list, status: params.status },
  });

  return (
    <AppShell user={user}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Orders</h1>
        <p className="mt-1 text-sm text-ink-muted">Confirm or reject pending orders and follow them to delivery.</p>
      </div>

      <ListToolbar
        searchPlaceholder="Order number, name or email"
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: STATUSES.map((status) => ({ value: status, label: status.toLowerCase() })),
          },
        ]}
      />

      {page.items.length === 0 ? (
        <EmptyState title="No orders match" description="Adjust the filters, or clear them to see everything." />
      ) : (
        <>
          {/* An order row has six columns, which is more than a phone can show. Below the
              table breakpoint the same rows render as cards rather than as a table that has
              to be dragged sideways. */}
          <ul className="space-y-3 md:hidden">
            {page.items.map((order) => (
              <li key={order.id}>
                <Card>
                  <CardBody className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/orders/${order.id}`}
                          className="block font-mono text-sm font-medium text-ink hover:text-accent"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="mt-0.5 truncate text-sm text-ink-soft">{order.customerName}</p>
                        <p className="truncate text-xs text-ink-muted">{order.customerEmail}</p>
                      </div>
                      <OrderStatusBadge status={order.status} compact />
                    </div>
                    <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2.5">
                      <span className="text-xs text-ink-muted">
                        {formatDateTime(order.placedAt)} · {order.itemCount}{' '}
                        {order.itemCount === 1 ? 'item' : 'items'}
                      </span>
                      <span className="font-medium tabular-nums text-ink">
                        {formatMoney(order.grandTotal, order.currency)}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>

          <TableShell className="hidden md:block">
            <caption className="sr-only">Orders</caption>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
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
                    <Link href={`/orders/${order.id}`} className="font-medium hover:text-accent">
                      {order.orderNumber}
                    </Link>
                  </Td>
                  <Td>
                    <span className="block text-ink">{order.customerName}</span>
                    <span className="block text-xs text-ink-muted">{order.customerEmail}</span>
                  </Td>
                  <Td className="text-ink-muted">{formatDateTime(order.placedAt)}</Td>
                  <Td className="text-ink-muted">{order.itemCount}</Td>
                  <Td>
                    <OrderStatusBadge status={order.status} />
                  </Td>
                  <Td className="text-right font-medium">{formatMoney(order.grandTotal, order.currency)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination
            page={page.meta.page}
            totalPages={page.meta.totalPages}
            totalItems={page.meta.totalItems}
            buildHref={(target) => buildHref('/orders', { ...params, page: target })}
          />
        </>
      )}
    </AppShell>
  );
}
