import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  OrderStatusBadge,
  TableShell,
  Td,
  Th,
  TrendChart,
  formatDate,
  formatMoney,
} from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { StatTile } from '@/components/stat-tile';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import type { DashboardSummary } from '@ecom/types';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

function compactMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return value.toFixed(0);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!can(user, 'dashboard:read')) {
    return (
      <AppShell user={user}>
        <EmptyState
          title="No dashboard access"
          description="Your role does not include permission to view dashboard statistics. Use the sections in the sidebar instead."
        />
      </AppShell>
    );
  }

  const token = await getAccessToken();
  const summary = await gateway.get<DashboardSummary>(endpoints.admin.dashboard, { token, cache: 'no-store' });
  const currency = summary.revenue.currency;

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Dashboard</h1>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            Revenue counts confirmed orders onwards; rejected and cancelled orders are excluded.
          </p>
        </div>
        {can(user, 'report:read') && (
          <Link
            href="/reports"
            className="inline-flex h-10 items-center rounded-lg border border-line-strong px-4 text-sm text-ink transition-colors hover:bg-surface-sunken"
          >
            Full reports
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Awaiting confirmation"
          value={String(summary.orders.pending)}
          hint="orders that need a decision"
          tone={summary.orders.pending > 0 ? 'caution' : 'positive'}
          href={can(user, 'order:read') ? '/orders?status=PENDING' : undefined}
        />
        <StatTile
          label="Revenue, last 30 days"
          value={formatMoney(summary.revenue.last30Days, currency)}
          hint={`${formatMoney(summary.revenue.lifetime, currency)} lifetime`}
          tone="positive"
        />
        <StatTile
          label="Out of stock"
          value={String(summary.catalogue.outOfStock)}
          hint={`${summary.catalogue.lowStock} more running low`}
          tone={summary.catalogue.outOfStock > 0 ? 'critical' : 'positive'}
          href={can(user, 'inventory:read') ? '/inventory?availability=out' : undefined}
        />
        <StatTile
          label="Live products"
          value={String(summary.catalogue.activeProducts)}
          hint={`${summary.catalogue.draftProducts} in draft · ${summary.catalogue.categories} categories`}
          href={can(user, 'product:read') ? '/products' : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Orders, all time" value={String(summary.orders.total)} hint={`${summary.orders.delivered} delivered`} />
        <StatTile label="In fulfilment" value={String(summary.orders.processing + summary.orders.shipped)} hint="being prepared or in transit" />
        <StatTile label="Customers" value={String(summary.customers.total)} />
        <StatTile label="Administrators" value={String(summary.customers.administrators)} />
      </div>

      <Card className="mt-8">
        <CardHeader title="Revenue, last 14 days" description="Net revenue per day across confirmed orders." />
        <CardBody>
          <TrendChart
            title="Net revenue over the last 14 days"
            valueLabel={`Net revenue (${currency})`}
            height={180}
            points={summary.salesTrend.map((point) => ({
              label: point.period.slice(8),
              value: Number(point.netRevenue),
            }))}
            formatValue={compactMoney}
          />
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="Recent orders"
            action={
              can(user, 'order:read') ? (
                <Link href="/orders" className="text-sm text-accent underline underline-offset-4">
                  All orders
                </Link>
              ) : undefined
            }
          />
          {summary.recentOrders.length === 0 ? (
            <CardBody>
              <p className="text-sm text-ink-muted">No orders have been placed yet.</p>
            </CardBody>
          ) : (
            <>
              {/* On a phone the same rows read better as a stacked list than as a table
                  that has to be scrolled sideways. */}
              <ul className="divide-y divide-line sm:hidden">
                {summary.recentOrders.map((order) => (
                  <li key={order.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/orders/${order.id}`} className="block font-mono text-sm font-medium hover:text-accent">
                          {order.orderNumber}
                        </Link>
                        <p className="truncate text-xs text-ink-muted">{order.customerName}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium tabular-nums">{formatMoney(order.grandTotal, currency)}</p>
                        <p className="mt-1">
                          <OrderStatusBadge status={order.status} compact />
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden sm:block">
                <TableShell className="rounded-none border-0 border-t">
                  <caption className="sr-only">The most recent orders</caption>
                  <thead>
                    <tr>
                      <Th>Order</Th>
                      <Th>Customer</Th>
                      <Th>Placed</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Total</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-surface-sunken">
                        <Td>
                          <Link href={`/orders/${order.id}`} className="font-mono font-medium hover:text-accent">
                            {order.orderNumber}
                          </Link>
                        </Td>
                        <Td className="text-ink-soft">{order.customerName}</Td>
                        <Td className="text-ink-muted">{formatDate(order.placedAt)}</Td>
                        <Td>
                          <OrderStatusBadge status={order.status} />
                        </Td>
                        <Td className="text-right font-medium tabular-nums">
                          {formatMoney(order.grandTotal, currency)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableShell>
              </div>
            </>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Needs restocking"
              action={
                can(user, 'inventory:read') ? (
                  <Link href="/inventory?availability=low" className="text-sm text-accent underline underline-offset-4">
                    Inventory
                  </Link>
                ) : undefined
              }
            />
            <CardBody>
              {summary.stockAlerts.length === 0 ? (
                <p className="text-sm text-ink-muted">Every live product is above its low stock threshold.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {summary.stockAlerts.map((alert) => (
                    <li key={alert.productId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{alert.name}</p>
                        <p className="font-mono text-xs text-ink-muted">{alert.sku}</p>
                      </div>
                      <Badge tone={alert.stockState === 'OUT_OF_STOCK' ? 'critical' : 'caution'}>
                        {alert.stockState === 'OUT_OF_STOCK' ? 'Out' : `${alert.stockQuantity} left`}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Best sellers" />
            <CardBody>
              {summary.topProducts.length === 0 ? (
                <p className="text-sm text-ink-muted">Nothing has sold yet.</p>
              ) : (
                <ol className="space-y-3">
                  {summary.topProducts.map((product, index) => (
                    <li key={product.productId} className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-sunken text-2xs font-semibold text-ink-muted">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{product.name}</span>
                        <span className="text-xs text-ink-muted">
                          {product.unitsSold} sold · {formatMoney(product.revenue, currency)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
