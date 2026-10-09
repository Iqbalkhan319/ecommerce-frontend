import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Badge, EmptyState, Pagination, TableShell, Td, Th, formatDate, formatMoney } from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { ListToolbar } from '@/components/list-toolbar';
import { AccountRowActions } from '@/components/account-actions';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { buildHref, parseListParams } from '@/lib/query';
import { can } from '@/lib/permissions';
import type { CustomerAccount } from '@ecom/types';

export const metadata: Metadata = { title: 'Customers' };
export const dynamic = 'force-dynamic';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const list = parseListParams(params);
  const token = await getAccessToken();

  const page = await gateway.getPage<CustomerAccount>(endpoints.admin.customers, {
    token,
    cache: 'no-store',
    query: { ...list, status: params.status },
  });

  return (
    <AppShell user={user}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Customers</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Identity is owned by the authentication service; order totals come from the commerce service.
        </p>
      </div>

      <ListToolbar
        searchPlaceholder="Name or email"
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: [
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspended' },
            ],
          },
        ]}
      />

      {page.items.length === 0 ? (
        <EmptyState title="No customers match" description="Adjust the search or filters." />
      ) : (
        <>
          <TableShell>
            <caption className="sr-only">Customer accounts</caption>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Joined</Th>
                <Th className="text-right">Orders</Th>
                <Th className="text-right">Lifetime value</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((customer) => (
                <tr key={customer.id} className="hover:bg-surface-sunken">
                  <Td>
                    <span className="block font-medium text-ink">{customer.fullName}</span>
                    <span className="block text-xs text-ink-muted">{customer.email}</span>
                  </Td>
                  <Td className="text-ink-muted">{formatDate(customer.createdAt)}</Td>
                  <Td className="text-right text-ink-soft">{customer.orderCount}</Td>
                  <Td className="text-right font-medium">
                    {customer.lifetimeValue ? formatMoney(customer.lifetimeValue) : '—'}
                  </Td>
                  <Td>
                    <Badge tone={customer.status === 'ACTIVE' ? 'positive' : 'caution'}>
                      {customer.status.toLowerCase()}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <AccountRowActions
                      scope="customers"
                      account={customer}
                      permissions={{ update: can(user, 'customer:update'), delete: can(user, 'customer:delete') }}
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
            buildHref={(target) => buildHref('/customers', { ...params, page: target })}
          />
        </>
      )}
    </AppShell>
  );
}
