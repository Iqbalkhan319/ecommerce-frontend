import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BarList,
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  StackedBar,
  TableShell,
  Td,
  Th,
  TrendChart,
  formatMoney,
} from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { StatTile } from '@/components/stat-tile';
import { ExportMenu, ReportControls } from './report-controls';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { buildHref } from '@/lib/query';
import { can } from '@/lib/permissions';
import type {
  CategoryPerformanceRow,
  CustomerReportRow,
  InventoryReport,
  OrderFunnelReport,
  ProductPerformanceRow,
  ReportRows,
  SalesReport,
} from '@ecom/types';

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Sales, margin, fulfilment and inventory reporting.',
};
export const dynamic = 'force-dynamic';

const ALLOWED_DAYS = new Set(['7', '30', '90', '365']);
const ALLOWED_GRANULARITY = new Set(['day', 'week', 'month']);

const PIPELINE_ORDER = [
  { key: 'PENDING', label: 'Awaiting confirmation' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Being prepared' },
  { key: 'SHIPPED', label: 'On its way' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

// A bare number is hard to read at a glance, so large money values are abbreviated on the
// chart axis while the tables keep the exact figure.
function compactMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return value.toFixed(0);
}

function shortPeriod(period: string, granularity: string): string {
  if (granularity === 'month') {
    const [year, month] = period.split('-');
    return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(month) - 1] ?? month} ${year.slice(2)}`;
  }
  const [, month, day] = period.split('-');
  return `${day}/${month}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!can(user, 'report:read')) {
    return (
      <AppShell user={user}>
        <EmptyState
          title="No reporting access"
          description="Your role does not include permission to view reports. Ask an administrator for the report:read permission."
        />
      </AppShell>
    );
  }

  const params = await searchParams;
  const days = ALLOWED_DAYS.has(params.days ?? '') ? (params.days as string) : '30';
  const granularity = ALLOWED_GRANULARITY.has(params.granularity ?? '')
    ? (params.granularity as string)
    : days === '365'
      ? 'month'
      : days === '7'
        ? 'day'
        : 'week';

  // The window is resolved here and sent as explicit timestamps, so every panel on the
  // page and every export link describe exactly the same period.
  const to = new Date();
  const from = new Date(to.getTime() - Number(days) * 86400_000);
  const range = { from: from.toISOString(), to: to.toISOString() };

  const token = await getAccessToken();
  const fetchOptions = { token, cache: 'no-store' as const };

  const [sales, products, categories, customers, funnel, inventory] = await Promise.all([
    gateway.get<SalesReport>(endpoints.admin.reportSales, {
      ...fetchOptions,
      query: { ...range, granularity },
    }),
    gateway.get<ReportRows<ProductPerformanceRow>>(endpoints.admin.reportProducts, {
      ...fetchOptions,
      query: { ...range, limit: 10 },
    }),
    gateway.get<ReportRows<CategoryPerformanceRow>>(endpoints.admin.reportCategories, {
      ...fetchOptions,
      query: range,
    }),
    gateway.get<ReportRows<CustomerReportRow>>(endpoints.admin.reportCustomers, {
      ...fetchOptions,
      query: { ...range, limit: 8 },
    }),
    gateway.get<OrderFunnelReport>(endpoints.admin.reportOrders, { ...fetchOptions, query: range }),
    gateway.get<InventoryReport>(endpoints.admin.reportInventory, {
      ...fetchOptions,
      query: { ...range, limit: 10 },
    }),
  ]);

  const currency = sales.window.currency;
  const change = sales.previous.changePercent;
  const canExport = can(user, 'report:export');

  const exportHref = (report: string, extra: Record<string, string | number> = {}) =>
    buildHref(`/reports/export/${report}`, { ...range, ...extra });

  const shortages = inventory.rows.filter((row) => row.stockState !== 'IN_STOCK');

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Reports</h1>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            Revenue counts an order from the moment it is confirmed. Rejected and cancelled orders are excluded
            throughout, because they never represent money owed.
          </p>
        </div>
        <ExportMenu
          disabledReason={canExport ? undefined : 'Exporting requires the report:export permission'}
          exports={[
            { href: exportHref('sales', { granularity }), label: 'Sales over time' },
            { href: exportHref('products', { limit: 200 }), label: 'Product performance' },
            { href: exportHref('categories'), label: 'Category performance' },
            { href: exportHref('customers', { limit: 200 }), label: 'Customers' },
            { href: exportHref('orders'), label: 'Order pipeline' },
            { href: exportHref('inventory', { limit: 200 }), label: 'Inventory valuation' },
          ]}
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <ReportControls granularity={granularity} days={days} />
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Net revenue"
          value={formatMoney(sales.totals.netRevenue, currency)}
          delta={
            change === null
              ? null
              : {
                  value: `${Math.abs(Number(change)).toFixed(1)}%`,
                  direction: Number(change) > 0 ? 'up' : Number(change) < 0 ? 'down' : 'flat',
                }
          }
          hint={change === null ? 'no comparable prior period' : 'versus the preceding period'}
          tone="positive"
        />
        <StatTile
          label="Orders"
          value={sales.totals.orders.toLocaleString()}
          hint={`${sales.totals.units} units · ${sales.totals.uniqueCustomers} customers`}
        />
        <StatTile
          label="Average order value"
          value={formatMoney(sales.totals.averageOrderValue, currency)}
          hint={`${formatMoney(sales.totals.tax, currency)} tax · ${formatMoney(sales.totals.shipping, currency)} shipping`}
        />
        <StatTile
          label="Confirmation rate"
          value={`${funnel.confirmationRate}%`}
          hint={`${funnel.attritionRate}% rejected or cancelled`}
          tone={Number(funnel.attritionRate) > 20 ? 'caution' : 'neutral'}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Revenue over time"
          description={`${granularity === 'day' ? 'Daily' : granularity === 'week' ? 'Weekly' : 'Monthly'} net revenue across the selected period.`}
        />
        <CardBody>
          <TrendChart
            title="Net revenue over time"
            valueLabel={`Net revenue (${currency})`}
            points={sales.buckets.map((bucket) => ({
              label: shortPeriod(bucket.period, granularity),
              value: Number(bucket.netRevenue),
            }))}
            formatValue={compactMoney}
          />
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Order pipeline" description="Every order placed in the period, by its current status." />
          <CardBody className="space-y-5">
            <StackedBar
              title="Order pipeline"
              segments={PIPELINE_ORDER.map((entry) => ({
                key: entry.key,
                label: entry.label,
                value: funnel.byStatus.find((row) => row.status === entry.key)?.orders ?? 0,
              }))}
            />
            <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4">
              <div>
                <dt className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">
                  Median time to confirm
                </dt>
                <dd className="mt-0.5 font-display text-lg text-ink">
                  {funnel.medianHoursToConfirm ? `${funnel.medianHoursToConfirm} h` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">
                  Median time to deliver
                </dt>
                <dd className="mt-0.5 font-display text-lg text-ink">
                  {funnel.medianHoursToDeliver ? `${funnel.medianHoursToDeliver} h` : '—'}
                </dd>
              </div>
            </dl>
            {funnel.rejectionReasons.length > 0 && (
              <div className="border-t border-line pt-4">
                <p className="mb-3 text-2xs font-semibold uppercase tracking-wide text-ink-muted">
                  Why orders were rejected
                </p>
                <BarList
                  title="Rejection reasons"
                  data={funnel.rejectionReasons.map((reason) => ({
                    label: reason.reason,
                    value: reason.orders,
                    display: String(reason.orders),
                  }))}
                />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Revenue by category" description="Each category's share of the period." />
          <CardBody>
            <BarList
              title="Revenue by category"
              emptyMessage="Nothing sold in this period."
              data={categories.rows.map((row) => ({
                label: row.name,
                value: Number(row.revenue),
                display: formatMoney(row.revenue, currency),
                hint: `${row.revenueShare}%`,
              }))}
            />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Product performance"
          description="Ranked by revenue. Margin is shown only where a cost price is recorded, so a partly costed catalogue cannot produce a misleading figure."
        />
        {products.rows.length === 0 ? (
          <CardBody>
            <p className="text-sm text-ink-muted">No products sold in this period.</p>
          </CardBody>
        ) : (
          <TableShell className="rounded-none border-0 border-t">
            <caption className="sr-only">Product performance</caption>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">Units</Th>
                <Th className="text-right">Revenue</Th>
                <Th className="text-right">Gross profit</Th>
                <Th className="text-right">Margin</Th>
                <Th className="text-right">On hand</Th>
              </tr>
            </thead>
            <tbody>
              {products.rows.map((row) => (
                <tr key={row.productId} className="hover:bg-surface-sunken">
                  <Td>
                    <span className="block font-medium text-ink">{row.name}</span>
                    <span className="block font-mono text-xs text-ink-muted">{row.sku}</span>
                  </Td>
                  <Td className="text-ink-soft">{row.categoryName ?? '—'}</Td>
                  <Td className="text-right tabular-nums text-ink-soft">{row.unitsSold}</Td>
                  <Td className="text-right font-medium tabular-nums">{formatMoney(row.revenue, currency)}</Td>
                  <Td className="text-right tabular-nums">
                    {row.grossProfit ? (
                      formatMoney(row.grossProfit, currency)
                    ) : (
                      <span className="text-xs text-ink-muted">no cost recorded</span>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {row.marginPercent ? `${row.marginPercent}%` : '—'}
                  </Td>
                  <Td className="text-right tabular-nums">
                    <span className={row.stockQuantity === 0 ? 'font-semibold text-critical' : 'text-ink-soft'}>
                      {row.stockQuantity}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Highest-value customers"
            description="Ranked by revenue in the period."
            action={
              can(user, 'customer:read') ? (
                <Link href="/customers" className="text-sm text-accent underline underline-offset-4">
                  All customers
                </Link>
              ) : undefined
            }
          />
          {customers.rows.length === 0 ? (
            <CardBody>
              <p className="text-sm text-ink-muted">No customers ordered in this period.</p>
            </CardBody>
          ) : (
            <ol className="divide-y divide-line">
              {customers.rows.map((row, index) => (
                <li key={row.customerId} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-sunken text-2xs font-semibold text-ink-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
                      <span className="truncate font-medium">{row.customerName}</span>
                      {row.isNewCustomer && <Badge tone="accent">New</Badge>}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{row.customerEmail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums text-ink">{formatMoney(row.revenue, currency)}</p>
                    <p className="text-xs text-ink-muted">
                      {row.orders} {row.orders === 1 ? 'order' : 'orders'} · {formatMoney(row.averageOrderValue, currency)} avg
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Inventory needing attention"
            description={`${formatMoney(inventory.totals.retailValue, currency)} of stock on hand at retail.`}
            action={
              can(user, 'inventory:read') ? (
                <Link href="/inventory" className="text-sm text-accent underline underline-offset-4">
                  Manage stock
                </Link>
              ) : undefined
            }
          />
          <CardBody className="space-y-4">
            <dl className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-line px-3 py-2">
                <dt className="text-2xs uppercase tracking-wide text-ink-muted">Out</dt>
                <dd
                  className={`mt-0.5 font-display text-xl ${inventory.totals.outOfStock > 0 ? 'text-critical' : 'text-ink'}`}
                >
                  {inventory.totals.outOfStock}
                </dd>
              </div>
              <div className="rounded-lg border border-line px-3 py-2">
                <dt className="text-2xs uppercase tracking-wide text-ink-muted">Low</dt>
                <dd
                  className={`mt-0.5 font-display text-xl ${inventory.totals.lowStock > 0 ? 'text-caution' : 'text-ink'}`}
                >
                  {inventory.totals.lowStock}
                </dd>
              </div>
              <div className="rounded-lg border border-line px-3 py-2">
                <dt className="text-2xs uppercase tracking-wide text-ink-muted">Units</dt>
                <dd className="mt-0.5 font-display text-xl text-ink">{inventory.totals.unitsOnHand}</dd>
              </div>
            </dl>

            {shortages.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Every tracked product is above its low stock threshold.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {shortages.slice(0, 6).map((row) => (
                  <li key={row.productId} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{row.name}</p>
                      <p className="font-mono text-xs text-ink-muted">{row.sku}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge tone={row.stockState === 'OUT_OF_STOCK' ? 'critical' : 'caution'}>
                        {row.stockState === 'OUT_OF_STOCK' ? 'Out of stock' : `${row.stockQuantity} left`}
                      </Badge>
                      <p className="mt-1 text-xs text-ink-muted">
                        {row.daysOfCover ? `${row.daysOfCover} days of cover` : 'no recent sales'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {inventory.totals.productsMissingCost > 0 && (
              <p className="rounded-lg border border-caution/30 bg-caution/10 px-3 py-2 text-xs text-ink-soft">
                {inventory.totals.productsMissingCost}{' '}
                {inventory.totals.productsMissingCost === 1 ? 'product has' : 'products have'} no cost price, so they are
                excluded from margin and cost valuation.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
