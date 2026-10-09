'use client';

import * as React from 'react';
import { useActionState, useTransition } from 'react';
import { Badge, Button, Checkbox, ConfirmDialog, Dialog, EmptyState, Field, Input, useToast } from '@ecom/ui';
import { SubmitButton } from '@/components/form-feedback';
import { deleteAddressAction, saveAddressAction } from '@/lib/actions/account';
import { initialFormState } from '@/lib/form-state';
import type { SavedAddress } from '@ecom/types';

export function AddressManager({ addresses, defaultName }: { addresses: SavedAddress[]; defaultName: string }) {
  const [state, formAction] = useActionState(saveAddressAction, initialFormState);
  const [editing, setEditing] = React.useState<SavedAddress | null>(null);
  const [open, setOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<SavedAddress | null>(null);
  const [removing, startRemoval] = useTransition();
  const toast = useToast();

  React.useEffect(() => {
    if (state.status === 'success') {
      setOpen(false);
      setEditing(null);
      toast.success(state.message ?? 'Address saved.');
    } else if (state.status === 'error' && state.message) {
      toast.error('Address not saved', state.message);
    }
  }, [state, toast]);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    startRemoval(async () => {
      const result = await deleteAddressAction(pendingDelete.id);
      if (result.status === 'error') toast.error('Not removed', result.message);
      else toast.success('Address removed.');
      setPendingDelete(null);
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Add an address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState title="No saved addresses" description="Add one now, or enter it during checkout." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-lg border border-line p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink">{address.label}</p>
                {address.isDefault && <Badge tone="accent">Default</Badge>}
              </div>
              <address className="mt-1.5 text-sm not-italic text-ink-muted">
                {address.fullName}
                <br />
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {address.city} {address.postalCode}, {address.country}
              </address>
              <div className="mt-3 flex gap-3">
                <Button
                  variant="link"
                  className="text-sm"
                  onClick={() => {
                    setEditing(address);
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="link" className="text-sm text-critical" onClick={() => setPendingDelete(address)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit address' : 'Add an address'}
        description="Used for delivery and on your invoice."
      >
        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="addressId" value={editing.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label" htmlFor="label" hint="Home, office, and so on">
              <Input id="label" name="label" defaultValue={editing?.label ?? 'Home'} />
            </Field>
            <Field label="Full name" htmlFor="addressFullName" required>
              <Input id="addressFullName" name="fullName" defaultValue={editing?.fullName ?? defaultName} required />
            </Field>
          </div>

          <Field label="Address line 1" htmlFor="line1" required error={state.fieldErrors?.line1}>
            <Input id="line1" name="line1" defaultValue={editing?.line1 ?? ''} required />
          </Field>

          <Field label="Address line 2" htmlFor="line2" hint="Optional">
            <Input id="line2" name="line2" defaultValue={editing?.line2 ?? ''} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" htmlFor="city" required>
              <Input id="city" name="city" defaultValue={editing?.city ?? ''} required />
            </Field>
            <Field label="Postcode" htmlFor="postalCode" required>
              <Input id="postalCode" name="postalCode" defaultValue={editing?.postalCode ?? ''} required />
            </Field>
            <Field label="Country" htmlFor="country" required hint="Two letters">
              <Input id="country" name="country" defaultValue={editing?.country ?? 'BD'} maxLength={2} required />
            </Field>
          </div>

          <Field label="Phone" htmlFor="addressPhone" hint="Optional">
            <Input id="addressPhone" name="phone" type="tel" defaultValue={editing?.phone ?? ''} />
          </Field>

          <Checkbox name="isDefault" defaultChecked={editing?.isDefault} label="Use as my default address" />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>Save address</SubmitButton>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this address?"
        description={`${pendingDelete?.label ?? ''} will be removed from your saved addresses. Orders already placed are unaffected.`}
        confirmLabel="Remove address"
        tone="danger"
        busy={removing}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
