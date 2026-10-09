'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Button, ConfirmDialog, useToast } from '@ecom/ui';
import { deactivateAccountAction, setAccountStatusAction } from '@/lib/actions/people';
import type { AdminAccount } from '@ecom/types';

export function AccountRowActions({
  scope,
  account,
  permissions,
}: {
  scope: 'admins' | 'customers';
  account: AdminAccount;
  permissions: { update: boolean; delete: boolean };
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = React.useState<'suspend' | 'reinstate' | 'deactivate' | null>(null);
  const toast = useToast();

  // The protected owner account is never actionable, and the interface says why.
  if (account.isSuperAdmin) {
    return <span className="text-xs text-ink-muted">Protected account</span>;
  }
  if (!permissions.update && !permissions.delete) {
    return <span className="text-xs text-ink-muted">View only</span>;
  }

  const run = (operation: () => Promise<{ status: string; message?: string }>) => {
    startTransition(async () => {
      const result = await operation();
      if (result.status === 'error') toast.error('That did not work', result.message);
      else toast.success(result.message ?? 'Done.');
      setConfirming(null);
    });
  };

  const suspended = account.status === 'SUSPENDED';

  return (
    <div className="flex justify-end gap-2">
      {permissions.update && (
        <Button variant="link" className="text-sm" onClick={() => setConfirming(suspended ? 'reinstate' : 'suspend')}>
          {suspended ? 'Reinstate' : 'Suspend'}
        </Button>
      )}
      {permissions.delete && (
        <Button variant="link" className="text-sm text-critical" onClick={() => setConfirming('deactivate')}>
          Deactivate
        </Button>
      )}

      <ConfirmDialog
        open={confirming === 'suspend'}
        title={`Suspend ${account.fullName}?`}
        description="They are signed out everywhere and cannot sign in again until reinstated. Their orders are unaffected."
        confirmLabel="Suspend account"
        tone="danger"
        busy={pending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => run(() => setAccountStatusAction(scope, account.id, 'SUSPENDED'))}
      />

      <ConfirmDialog
        open={confirming === 'reinstate'}
        title={`Reinstate ${account.fullName}?`}
        description="They will be able to sign in again immediately."
        confirmLabel="Reinstate account"
        busy={pending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => run(() => setAccountStatusAction(scope, account.id, 'ACTIVE'))}
      />

      <ConfirmDialog
        open={confirming === 'deactivate'}
        title={`Deactivate ${account.fullName}?`}
        description="The account is closed and every session revoked. Order history is retained for the record. This cannot be undone from here."
        confirmLabel="Deactivate account"
        tone="danger"
        busy={pending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => run(() => deactivateAccountAction(scope, account.id))}
      />
    </div>
  );
}
