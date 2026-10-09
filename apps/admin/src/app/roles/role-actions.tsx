'use client';

import * as React from 'react';
import { useActionState, useTransition } from 'react';
import { Button, Checkbox, ConfirmDialog, Dialog, Field, Input, Textarea, useToast } from '@ecom/ui';
import { deleteRoleAction, saveRoleAction } from '@/lib/actions/people';
import { initialFormState } from '@/lib/form-state';
import type { Permission, Role } from '@ecom/types';

function groupByResource(permissions: Permission[]): Array<[string, Permission[]]> {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    groups.set(permission.resource, [...(groups.get(permission.resource) ?? []), permission]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function RoleForm({
  role,
  permissions,
  onDone,
}: {
  role?: Role;
  permissions: Permission[];
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(saveRoleAction, initialFormState);
  const toast = useToast();

  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message ?? 'Saved.');
      onDone();
    } else if (state.status === 'error' && state.message) {
      toast.error('Not saved', state.message);
    }
  }, [state, toast, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {role && <input type="hidden" name="id" value={role.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="roleName" required error={state.fieldErrors?.name}>
          <Input id="roleName" name="name" defaultValue={role?.name} required />
        </Field>
        {!role && (
          <Field label="Code" htmlFor="roleCode" required hint="Upper case, e.g. FULFILMENT" error={state.fieldErrors?.code}>
            <Input id="roleCode" name="code" required pattern="[A-Z][A-Z0-9_]{2,39}" />
          </Field>
        )}
      </div>

      <Field label="Description" htmlFor="roleDescription">
        <Textarea id="roleDescription" name="description" rows={2} defaultValue={role?.description ?? ''} maxLength={240} />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Permissions</legend>
        <div className="max-h-72 space-y-4 overflow-y-auto rounded border border-line p-3">
          {groupByResource(permissions).map(([resource, group]) => (
            <div key={resource}>
              <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-muted">{resource}</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {group.map((permission) => (
                  <Checkbox
                    key={permission.id}
                    name="permissions"
                    value={permission.code}
                    defaultChecked={role?.permissions.includes(permission.code)}
                    label={permission.action}
                    description={permission.description ?? undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{role ? 'Save role' : 'Create role'}</Button>
      </div>
    </form>
  );
}

export function NewRoleButton({ permissions }: { permissions: Permission[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New role</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="New role" size="lg">
        <RoleForm permissions={permissions} onDone={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

export function RoleActions({
  role,
  permissions,
  can: allowed,
}: {
  role: Role;
  permissions: Permission[];
  can: { edit: boolean; delete: boolean };
}) {
  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  if (role.isSystem) return <span className="text-xs text-ink-muted">Protected</span>;
  if (!allowed.edit && !allowed.delete) return null;

  const remove = () => {
    startTransition(async () => {
      const result = await deleteRoleAction(role.id);
      if (result.status === 'error') toast.error('Not deleted', result.message);
      else toast.success(result.message ?? 'Role deleted.');
      setDeleting(false);
    });
  };

  return (
    <div className="flex gap-2">
      {allowed.edit && (
        <Button variant="link" className="text-sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
      )}
      {allowed.delete && (
        <Button
          variant="link"
          className="text-sm text-critical"
          onClick={() => setDeleting(true)}
          disabled={role.userCount > 0}
          title={role.userCount > 0 ? 'Reassign the accounts holding this role first' : undefined}
        >
          Delete
        </Button>
      )}

      <Dialog open={editing} onClose={() => setEditing(false)} title={`Edit ${role.name}`} size="lg">
        <RoleForm role={role} permissions={permissions} onDone={() => setEditing(false)} />
      </Dialog>

      <ConfirmDialog
        open={deleting}
        title={`Delete ${role.name}?`}
        description="Only a role that nobody holds can be deleted. This cannot be undone."
        confirmLabel="Delete role"
        tone="danger"
        busy={pending}
        onCancel={() => setDeleting(false)}
        onConfirm={remove}
      />
    </div>
  );
}
