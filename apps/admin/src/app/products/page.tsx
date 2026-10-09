import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Badge, EmptyState, Pagination, TableShell, Td, Th, formatMoney } from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { ListToolbar } from '@/components/list-toolbar';
import { ProductRowActions, NewProductButton } from './product-actions';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { buildHref, parseListParams } from '@/lib/query';
import { can } from '@/lib/permissions';
import type { Category, Product } from '@ecom/types';

export const metadata: Metadata = { title: 'Products' };
export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const list = parseListParams(params, { sort: 'createdAt' });
  const token = await getAccessToken();

  const [page, categories] = await Promise.all([
    gateway.getPage<Product>(endpoints.admin.products, {
      token,
      cache: 'no-store',
      query: { ...list, status: params.status, lowStock: params.lowStock === 'true' ? true : undefined },
    }),
    gateway.getPage<Category>(endpoints.admin.categories, { token, cache: 'no-store', query: { limit: 100 } }),
  ]);

  const editable = can(user, 'product:update');
  const creatable = can(user, 'product:create');
  const deletable = can(user, 'product:delete');

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Products</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Stock is adjusted through an audited entry, never edited in place.
          </p>
        </div>
        {creatable && <NewProductButton categories={categories.items} />}
      </div>

      <ListToolbar
        searchPlaceholder="Name, SKU or slug"
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: [
              { value: 'ACTIVE', label: 'Live' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'ARCHIVED', label: 'Archived' },
            ],
          },
          { name: 'lowStock', label: 'Stock', options: [{ value: 'true', label: 'Low stock only' }] },
        ]}
      />

      {page.items.length === 0 ? (
        <EmptyState
          title="No products match"
          description={creatable ? 'Adjust the filters, or add the first product.' : 'Adjust the filters to see more.'}
        />
      ) : (
        <>
          <TableShell>
            <caption className="sr-only">Products</caption>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((product) => (
                <tr key={product.id} className="hover:bg-surface-sunken">
                  <Td>
                    <span className="block font-medium text-ink">{product.name}</span>
                    <span className="block text-xs text-ink-muted">{product.sku}</span>
                  </Td>
                  <Td className="text-ink-soft">{product.category.name}</Td>
                  <Td>
                    <Badge tone={product.status === 'ACTIVE' ? 'positive' : product.status === 'DRAFT' ? 'caution' : 'neutral'}>
                      {product.status.toLowerCase()}
                    </Badge>
                  </Td>
                  <Td className="text-right font-medium">{formatMoney(product.price, product.currency)}</Td>
                  <Td className="text-right">
                    <span className={product.stockQuantity === 0 ? 'text-critical' : product.isLowStock ? 'text-caution' : 'text-ink'}>
                      {product.stockQuantity}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <ProductRowActions
                      product={product}
                      categories={categories.items}
                      permissions={{ edit: editable, delete: deletable }}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination
            page={page.meta.page}
            totalPages={page.meta.totalPages}
            totalItems={page.meta.totalItems}
            buildHref={(target) => buildHref('/products', { ...params, page: target })}
          />
        </>
      )}
    </AppShell>
  );
}
