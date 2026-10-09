import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  Card,
  CardBody,
  EmptyState,
  Pagination,
  TableShell,
  Td,
  Th,
  formatDate,
  formatMoney,
} from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { ListToolbar } from '@/components/list-toolbar';
import { StatTile } from '@/components/stat-tile';
import { StockRowActions, StockStateBadge, ValuationCell } from './inventory-actions';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { buildHref, parseListParams } from '@/lib/query';
import { can } from '@/lib/permissions';
import type { Category, InventorySummary, MovementReasonOption, StockLevel } from '@ecom/types';

export const metadata: Metadata = {
  title: 'Inventory',
  description: 'Stock levels, valuation and the movement ledger.',
};
export const dynamic = 'force-dynamic';

const AVAILABILITY_OPTIONS = [
  { value: 'out', label: 'Out of stock' },
  { value: 'low', label: 'Running low' },
  { value: 'in_stock', label: 'In stock' },
];

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!can(user, 'inventory:read')) {
    return (
      <AppShell user={user}>
        <EmptyState
          title="No inventory access"
          description="Your role does not include permission to view stock levels. Ask an administrator for the inventory:read permission."
        />
      </AppShell>
    );
  }

  const params = await searchParams;
  const list = parseListParams(params, { sort: 'stockQuantity', order: 'asc' });
  const token = await getAccessToken();
  const canAdjust = can(user, 'inventory:adjust');

  const [summary, page, categories, reasons] = await Promise.all([
    gateway.get<InventorySummary>(endpoints.admin.inventorySummary, { token, cache: 'no-store' }),
    gateway.getPage<StockLevel>(endpoints.admin.inventoryStock, {
      token,
      cache: 'no-store',
      query: {
        ...list,
        availability: params.availability,
        categoryId: params.categoryId,
        activeOnly: params.activeOnly === 'true' ? true : undefined,
      },
    }),
    gateway.getPage<Category>(endpoints.admin.categories, { token, cache: 'no-store', query: { limit: 100 } }),
    gateway.get<MovementReasonOption[]>(endpoints.admin.inventoryReasons, { token, cache: 'no-store' }),
  ]);

  const currency = summary.currency;

  return (
    <AppShell user={user}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Inventory</h1>
        <p className="mt-1 max-w-prose text-sm text-ink-muted">
          Stock is never edited in place. Every change — a sale, a release from a rejected order, a delivery or a
          count — is appended to the ledger with a reason and an actor.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Out of stock"
          value={String(summary.outOfStock)}
          hint={`${summary.lowStock} more running low`}
          tone={summary.outOfStock > 0 ? 'critical' : 'positive'}
          href="/inventory?availability=out"
        />
        <StatTile
          label="Units on hand"
          value={summary.unitsOnHand.toLocaleString()}
          hint={`across ${summary.trackedProducts} tracked products`}
        />
        <StatTile
          label="Stock value at retail"
          value={formatMoney(summary.retailValue, currency)}
          hint={
            summary.productsMissingCost > 0
              ? `${formatMoney(summary.costValue, currency)} at cost · ${summary.productsMissingCost} without a cost`
              : `${formatMoney(summary.costValue, currency)} at cost`
          }
        />
        <StatTile
          label="Moved in 30 days"
          value={`−${summary.unitsSold30d} / +${summary.unitsReceived30d}`}
          hint="units sold versus units received"
        />
      </div>

      <div className="mt-8">
        <ListToolbar
          searchPlaceholder="Product name or SKU"
          filters={[
            { name: 'availability', label: 'Availability', options: AVAILABILITY_OPTIONS },
            {
              name: 'categoryId',
              label: 'Category',
              options: categories.items.map((category) => ({ value: category.id, label: category.name })),
            },
            { name: 'activeOnly', label: 'Visibility', options: [{ value: 'true', label: 'Live products only' }] },
          ]}
        />
      </div>

      {page.items.length === 0 ? (
        <EmptyState
          title="No products match"
          description="Adjust the filters to see more of the catalogue."
        />
      ) : (
        <>
          {/* A stock table has too many columns for a phone, so the same rows render as
              cards below the small breakpoint rather than scrolling sideways. */}
          <ul className="space-y-3 lg:hidden">
            {page.items.map((level) => (
              <li key={level.productId}>
                <Card>
                  <CardBody className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{level.name}</p>
                        <p className="mt-0.5 font-mono text-xs text-ink-muted">{level.sku}</p>
                      </div>
                      <StockStateBadge state={level.stockState} quantity={level.stockQuantity} />
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <dt className="text-2xs uppercase tracking-wide text-ink-muted">On hand</dt>
                        <dd className="font-medium text-ink">
                          {level.stockQuantity}
                          <span className="text-xs font-normal text-ink-muted"> / warns at {level.lowStockThreshold}</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-2xs uppercase tracking-wide text-ink-muted">Sold, 30 days</dt>
                        <dd className="text-ink">{level.unitsSold30d}</dd>
                      </div>
                      <div>
                        <dt className="text-2xs uppercase tracking-wide text-ink-muted">Value</dt>
                        <dd className="text-ink">{formatMoney(level.retailValue, currency)}</dd>
                      </div>
                      <div>
                        <dt className="text-2xs uppercase tracking-wide text-ink-muted">Category</dt>
                        <dd className="truncate text-ink-soft">{level.category.name}</dd>
                      </div>
                    </dl>

                    <StockRowActions level={level} reasons={reasons} canAdjust={canAdjust} />
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <TableShell>
              <caption className="sr-only">Stock levels</caption>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th>Availability</Th>
                  <Th className="text-right">On hand</Th>
                  <Th className="text-right">Sold, 30d</Th>
                  <Th className="text-right">Value</Th>
                  <Th>Last movement</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((level) => (
                  <tr key={level.productId} className="hover:bg-surface-sunken">
                    <Td>
                      <span className="block font-medium text-ink">{level.name}</span>
                      <span className="block font-mono text-xs text-ink-muted">{level.sku}</span>
                    </Td>
                    <Td className="text-ink-soft">{level.category.name}</Td>
                    <Td>
                      <StockStateBadge state={level.stockState} quantity={level.stockQuantity} />
                    </Td>
                    <Td className="text-right">
                      <span
                        className={
                          level.stockState === 'OUT_OF_STOCK'
                            ? 'font-semibold text-critical'
                            : level.stockState === 'LOW'
                              ? 'font-semibold text-caution'
                              : 'text-ink'
                        }
                      >
                        {level.stockQuantity}
                      </span>
                      <span className="block text-xs text-ink-muted">warns at {level.lowStockThreshold}</span>
                    </Td>
                    <Td className="text-right text-ink-soft">{level.unitsSold30d}</Td>
                    <Td>
                      <ValuationCell retail={level.retailValue} cost={level.costValue} currency={currency} />
                    </Td>
                    <Td className="text-ink-muted">
                      {level.lastMovementAt ? formatDate(level.lastMovementAt) : '—'}
                    </Td>
                    <Td>
                      <StockRowActions level={level} reasons={reasons} canAdjust={canAdjust} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>

          <Pagination
            page={page.meta.page}
            totalPages={page.meta.totalPages}
            totalItems={page.meta.totalItems}
            buildHref={(target) => buildHref('/inventory', { ...params, page: target })}
          />
        </>
      )}
    </AppShell>
  );
}
