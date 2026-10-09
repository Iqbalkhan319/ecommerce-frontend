import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Badge, Card, CardBody, EmptyState } from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { NewRoleButton, RoleActions } from './role-actions';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import type { Permission, Role } from '@ecom/types';

export const metadata: Metadata = { title: 'Roles and permissions' };
export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const token = await getAccessToken();
  const [roles, permissions] = await Promise.all([
    gateway.get<Role[]>(endpoints.admin.roles, { token, cache: 'no-store' }),
    can(user, 'permission:read')
      ? gateway.get<Permission[]>(endpoints.admin.permissions, { token, cache: 'no-store' })
      : Promise.resolve([] as Permission[]),
  ]);

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Roles and permissions</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Platform-managed roles cannot be edited. Changing a role applies to every account that holds it.
          </p>
        </div>
        {can(user, 'role:create') && permissions.length > 0 && <NewRoleButton permissions={permissions} />}
      </div>

      {roles.length === 0 ? (
        <EmptyState title="No roles defined" description="Roles are seeded on first start." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg text-ink">{role.name}</h2>
                      {role.isSystem && <Badge tone="accent">Platform managed</Badge>}
                    </div>
                    <p className="font-mono text-xs text-ink-muted">{role.code}</p>
                    {role.description && <p className="mt-1.5 text-sm text-ink-muted">{role.description}</p>}
                  </div>
                  <RoleActions
                    role={role}
                    permissions={permissions}
                    can={{ edit: can(user, 'role:update'), delete: can(user, 'role:delete') }}
                  />
                </div>

                <p className="mt-4 text-2xs font-semibold uppercase tracking-wide text-ink-muted">
                  {role.permissions.length} permissions · held by {role.userCount}{' '}
                  {role.userCount === 1 ? 'account' : 'accounts'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {role.permissions.slice(0, 12).map((permission) => (
                    <span key={permission} className="rounded bg-surface-sunken px-2 py-0.5 font-mono text-2xs text-ink-soft">
                      {permission}
                    </span>
                  ))}
                  {role.permissions.length > 12 && (
                    <span className="px-1 text-2xs text-ink-muted">+{role.permissions.length - 12} more</span>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
