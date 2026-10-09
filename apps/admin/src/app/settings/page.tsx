import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Badge, Card, CardBody, DescriptionList, formatDateTime } from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { PasswordForm } from './password-form';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Your settings' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <AppShell user={user}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Your settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Your account and the permissions it currently carries.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg text-ink">Account</h2>
          </div>
          <CardBody className="space-y-4">
            <DescriptionList
              items={[
                { term: 'Name', detail: user.fullName },
                { term: 'Email', detail: user.email },
                { term: 'Last signed in', detail: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'This session' },
                {
                  term: 'Roles',
                  detail: user.isSuperAdmin ? (
                    <Badge tone="accent">Super administrator</Badge>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} tone="neutral">
                          {role.toLowerCase()}
                        </Badge>
                      ))}
                    </span>
                  ),
                },
              ]}
            />
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">
                Effective permissions ({user.permissions.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {user.permissions.map((permission) => (
                  <span key={permission} className="rounded bg-surface-sunken px-2 py-0.5 font-mono text-2xs text-ink-soft">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg text-ink">Change password</h2>
          </div>
          <CardBody>
            <p className="mb-4 text-sm text-ink-muted">
              Changing your password signs you out of every device, including this one.
            </p>
            <PasswordForm />
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
