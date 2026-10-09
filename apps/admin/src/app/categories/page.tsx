import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Badge, EmptyState, TableShell, Td, Th } from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { CategoryActions, NewCategoryButton } from './category-actions';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import type { Category } from '@ecom/types';

export const metadata: Metadata = { title: 'Categories' };
export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const token = await getAccessToken();
  const page = await gateway.getPage<Category>(endpoints.admin.categories, {
    token,
    cache: 'no-store',
    query: { limit: 100 },
  });

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Categories</h1>
          <p className="mt-1 text-sm text-ink-muted">A category holding products cannot be deleted.</p>
        </div>
        {can(user, 'category:create') && <NewCategoryButton />}
      </div>

      {page.items.length === 0 ? (
        <EmptyState title="No categories yet" description="Create the first category to start organising the catalogue." />
      ) : (
        <TableShell>
          <caption className="sr-only">Categories</caption>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th className="text-right">Products</Th>
              <Th>Visibility</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((category) => (
              <tr key={category.id} className="hover:bg-surface-sunken">
                <Td>
                  <span className="block font-medium text-ink">{category.name}</span>
                  {category.description && (
                    <span className="block max-w-md truncate text-xs text-ink-muted">{category.description}</span>
                  )}
                </Td>
                <Td className="font-mono text-xs text-ink-muted">{category.slug}</Td>
                <Td className="text-right text-ink-soft">{category.productCount}</Td>
                <Td>
                  <Badge tone={category.isActive ? 'positive' : 'neutral'}>
                    {category.isActive ? 'visible' : 'hidden'}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <CategoryActions
                    category={category}
                    permissions={{ edit: can(user, 'category:update'), delete: can(user, 'category:delete') }}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </AppShell>
  );
}
