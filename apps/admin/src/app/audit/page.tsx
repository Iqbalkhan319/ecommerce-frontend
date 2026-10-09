import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Badge, EmptyState, Pagination, TableShell, Td, Th, formatDateTime } from '@ecom/ui';
import { AppShell } from '@/components/app-shell';
import { ListToolbar } from '@/components/list-toolbar';
import { endpoints, gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { buildHref, parseListParams } from '@/lib/query';
import type { AuditEntry } from '@ecom/types';

export const metadata: Metadata = { title: 'Audit trail' };
export const dynamic = 'force-dynamic';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const list = parseListParams(params, { limit: 25 });
  const token = await getAccessToken();

  const [page, actions] = await Promise.all([
    gateway.getPage<AuditEntry>(endpoints.admin.auditLogs, {
      token,
      cache: 'no-store',
      query: { ...list, action: params.action, resource: params.resource },
    }),
    gateway
      .get<Array<{ action: string; count: number }>>(endpoints.admin.auditActions, { token, cache: 'no-store' })
      .catch(() => []),
  ]);

  return (
    <AppShell user={user}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Audit trail</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Append-only. Administrator actions recorded here, plus authentication events projected from the auth service.
        </p>
      </div>

      <ListToolbar
        searchPlaceholder="Actor, action or resource id"
        filters={[
          {
            name: 'action',
            label: 'Action',
            options: actions.map((entry) => ({ value: entry.action, label: `${entry.action} (${entry.count})` })),
          },
          {
            name: 'resource',
            label: 'Resource',
            options: ['product', 'category', 'order', 'admin', 'customer', 'role', 'invoice', 'identity'].map((value) => ({
              value,
              label: value,
            })),
          },
        ]}
      />

      {page.items.length === 0 ? (
        <EmptyState title="Nothing recorded yet" description="Actions appear here as soon as they happen." />
      ) : (
        <>
          <TableShell>
            <caption className="sr-only">Audit entries</caption>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Resource</Th>
                <Th>Request</Th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((entry) => (
                <tr key={entry.id} className="hover:bg-surface-sunken">
                  <Td className="whitespace-nowrap text-ink-muted">{formatDateTime(entry.createdAt)}</Td>
                  <Td>
                    <span className="block text-ink">{entry.actorEmail ?? 'System'}</span>
                    <span className="block text-2xs uppercase tracking-wide text-ink-muted">{entry.actorType}</span>
                  </Td>
                  <Td>
                    <Badge tone={entry.action.includes('reject') || entry.action.includes('delete') ? 'critical' : 'neutral'}>
                      {entry.action}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="block text-ink-soft">{entry.resource}</span>
                    {entry.resourceId && (
                      <span className="block font-mono text-2xs text-ink-muted">{entry.resourceId.slice(0, 8)}…</span>
                    )}
                  </Td>
                  <Td className="font-mono text-2xs text-ink-muted">{entry.requestId?.slice(0, 8) ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination
            page={page.meta.page}
            totalPages={page.meta.totalPages}
            totalItems={page.meta.totalItems}
            buildHref={(target) => buildHref('/audit', { ...params, page: target })}
          />
        </>
      )}
    </AppShell>
  );
}
