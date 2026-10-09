import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Badge, EmptyState, Pagination, TableShell, Td, Th, formatDate } from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { ListToolbar } from '@/components/list-toolbar';
import { AccountRowActions } from '@/components/account-actions';
import { NewAdministratorButton, RoleAssignment } from './administrator-actions';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { buildHref, parseListParams } from '@/lib/query';
import { can } from '@/lib/permissions';
import type { AdminAccount, Role } from '@ecom/types';

export const metadata: Metadata = { title: 'Administrators' };
export const dynamic = 'force-dynamic';

export default async function AdministratorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const list = parseListParams(params);
  const token = await getAccessToken();

  const [page, roles] = await Promise.all([
    gateway.getPage<AdminAccount>(endpoints.admin.admins, { token, cache: 'no-store', query: { ...list, status: params.status } }),
    can(user, 'role:read')
      ? gateway.get<Role[]>(endpoints.admin.roles, { token, cache: 'no-store' })
      : Promise.resolve([] as Role[]),
  ]);

  const assignable = roles.filter((role) => role.code !== 'SUPER_ADMIN' && role.code !== 'CUSTOMER');

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Administrators</h1>
          <p className="mt-1 text-sm text-ink-muted">
            The super administrator account is protected: it cannot be deleted, suspended or re-roled.
          </p>
        </div>
        {can(user, 'admin:create') && assignable.length > 0 && <NewAdministratorButton roles={assignable} />}
      </div>

      <ListToolbar searchPlaceholder="Name or email" />

      {page.items.length === 0 ? (
        <EmptyState title="No administrators match" description="Adjust the search." />
      ) : (
        <>
          <TableShell>
            <caption className="sr-only">Administrator accounts</caption>
            <thead>
              <tr>
                <Th>Administrator</Th>
                <Th>Roles</Th>
                <Th>Last signed in</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((account) => (
                <tr key={account.id} className="hover:bg-surface-sunken">
                  <Td>
                    <span className="block font-medium text-ink">{account.fullName}</span>
                    <span className="block text-xs text-ink-muted">{account.email}</span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {account.isSuperAdmin ? (
                        <Badge tone="accent">Super administrator</Badge>
                      ) : (
                        <>
                          {account.roles.map((role) => (
                            <Badge key={role} tone="neutral">
                              {role.toLowerCase()}
                            </Badge>
                          ))}
                          {can(user, 'admin:update') && account.id !== user.id && assignable.length > 0 && (
                            <RoleAssignment account={account} roles={assignable} />
                          )}
                        </>
                      )}
                    </div>
                  </Td>
                  <Td className="text-ink-muted">{account.lastLoginAt ? formatDate(account.lastLoginAt) : 'Never'}</Td>
                  <Td>
                    <Badge tone={account.status === 'ACTIVE' ? 'positive' : 'caution'}>
                      {account.status.toLowerCase()}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    {account.id === user.id ? (
                      <span className="text-xs text-ink-muted">You</span>
                    ) : (
                      <AccountRowActions
                        scope="admins"
                        account={account}
                        permissions={{ update: can(user, 'admin:update'), delete: can(user, 'admin:delete') }}
                      />
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination
            page={page.meta.page}
            totalPages={page.meta.totalPages}
            totalItems={page.meta.totalItems}
            buildHref={(target) => buildHref('/administrators', { ...params, page: target })}
          />
        </>
      )}
    </AppShell>
  );
}
