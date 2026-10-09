'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Button, Card, CardBody, ConfirmDialog, Field, Textarea, useToast } from '@ecom/ui';
import { confirmOrderAction, rejectOrderAction, updateOrderNoteAction, updateOrderStatusAction } from '@/lib/actions/orders';

const NEXT_STATUS: Record<string, { value: string; label: string } | undefined> = {
  CONFIRMED: { value: 'PROCESSING', label: 'Start preparing' },
  PROCESSING: { value: 'SHIPPED', label: 'Mark as shipped' },
  SHIPPED: { value: 'DELIVERED', label: 'Mark as delivered' },
};

export function OrderActions({
  orderId,
  status,
  internalNote,
  invoiceAvailable,
  permissions,
}: {
  orderId: string;
  status: string;
  internalNote: string;
  invoiceAvailable: boolean;
  permissions: { confirm: boolean; reject: boolean; update: boolean; invoice: boolean };
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = React.useState<'confirm' | 'reject' | 'advance' | null>(null);
  const [reason, setReason] = React.useState('');
  const [note, setNote] = React.useState(internalNote);
  const toast = useToast();

  const run = (operation: () => Promise<{ status: string; message?: string }>) => {
    startTransition(async () => {
      const result = await operation();
      if (result.status === 'error') toast.error('That did not work', result.message);
      else toast.success(result.message ?? 'Done.');
      setDialog(null);
      setReason('');
    });
  };

  const advance = NEXT_STATUS[status];
  const isPending = status === 'PENDING';
  const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(status);

  return (
    <>
      <Card>
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-lg text-ink">Actions</h2>
        </div>
        <CardBody className="space-y-3">
          {isPending && permissions.confirm && (
            <Button fullWidth onClick={() => setDialog('confirm')} disabled={pending}>
              Confirm order
            </Button>
          )}
          {isPending && permissions.reject && (
            <Button fullWidth variant="danger" onClick={() => setDialog('reject')} disabled={pending}>
              Reject order
            </Button>
          )}
          {advance && permissions.update && (
            <Button fullWidth variant="secondary" onClick={() => setDialog('advance')} disabled={pending}>
              {advance.label}
            </Button>
          )}
          {canCancel && permissions.update && !isPending && (
            <Button
              fullWidth
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => updateOrderStatusAction(orderId, 'CANCELLED', 'Cancelled by an administrator'))}
            >
              Cancel order
            </Button>
          )}
          {invoiceAvailable && permissions.invoice && (
            <a
              href={`/orders/${orderId}/invoice`}
              className="inline-flex h-10 w-full items-center justify-center rounded border border-line-strong text-sm text-ink hover:bg-surface-sunken"
            >
              Download invoice
            </a>
          )}
          {!isPending && !advance && !canCancel && (
            <p className="text-sm text-ink-muted">This order has reached a final state. No further action is possible.</p>
          )}
          {isPending && !permissions.confirm && !permissions.reject && (
            <p className="text-sm text-ink-muted">Your role does not include permission to decide on orders.</p>
          )}
        </CardBody>
      </Card>

      {permissions.update && (
        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg text-ink">Internal note</h2>
          </div>
          <CardBody className="space-y-3">
            <Field label="Visible to administrators only" htmlFor="internalNote">
              <Textarea
                id="internalNote"
                rows={3}
                value={note}
                maxLength={1000}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
            <Button
              variant="secondary"
              size="sm"
              loading={pending}
              onClick={() => run(() => updateOrderNoteAction(orderId, note))}
            >
              Save note
            </Button>
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        open={dialog === 'confirm'}
        title="Confirm this order?"
        description="Confirming reserves the stock permanently, issues the invoice and notifies the customer. It cannot be undone; the order can only be cancelled afterwards."
        confirmLabel="Confirm order"
        busy={pending}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(() => confirmOrderAction(orderId, reason || undefined))}
      >
        <Field label="Note" htmlFor="confirmNote" hint="Optional. Recorded in the order history.">
          <Textarea id="confirmNote" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'reject'}
        title="Reject this order?"
        description="Every reserved unit returns to the catalogue and the customer is told why. This cannot be undone."
        confirmLabel="Reject order"
        tone="danger"
        busy={pending || reason.trim().length < 4}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(() => rejectOrderAction(orderId, reason))}
      >
        <Field label="Reason" htmlFor="rejectReason" required hint="Shown to the customer. At least four characters.">
          <Textarea
            id="rejectReason"
            rows={3}
            value={reason}
            required
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'advance'}
        title={advance ? `${advance.label}?` : 'Advance the order?'}
        description="This moves the order to the next step and is recorded in its history."
        confirmLabel={advance?.label ?? 'Continue'}
        busy={pending}
        onCancel={() => setDialog(null)}
        onConfirm={() => advance && run(() => updateOrderStatusAction(orderId, advance.value))}
      />
    </>
  );
}
