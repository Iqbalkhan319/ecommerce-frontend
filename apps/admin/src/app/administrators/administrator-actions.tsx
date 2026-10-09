'use client';

import * as React from 'react';
import { useActionState, useTransition } from 'react';
import { Button, Checkbox, Dialog, Field, Input, useToast } from '@ecom/ui';
import { createAdministratorAction, updateAdministratorRolesAction } from '@/lib/actions/people';
import { initialFormState } from '@/lib/form-state';
import type { AdminAccount, Role } from '@ecom/types';

export function NewAdministratorButton({ roles }: { roles: Role[] }) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(createAdministratorAction, initialFormState);
  const toast = useToast();

  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message ?? 'Administrator created.');
      setOpen(false);
    } else if (state.status === 'error' && state.message) {
      toast.error('Not created', state.message);
    }
  }, [state, toast]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>New administrator</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="New administrator"
        description="They receive the permissions carried by the roles you choose. The super administrator role can never be granted here."
      >
        <form action={formAction} className="space-y-4">
          <Field label="Full name" htmlFor="fullName" required error={state.fieldErrors?.fullName}>
            <Input id="fullName" name="fullName" required />
          </Field>
          <Field label="Email address" htmlFor="adminEmail" required error={state.fieldErrors?.email}>
            <Input id="adminEmail" name="email" type="email" required autoComplete="off" />
          </Field>
          <Field
            label="Initial password"
            htmlFor="adminPassword"
            required
            hint="At least 10 characters with upper case, lower case and a digit. They should change it after signing in."
            error={state.fieldErrors?.password}
          >
            <Input id="adminPassword" name="password" type="password" required minLength={10} autoComplete="new-password" />
          </Field>
          <Field label="Phone" htmlFor="adminPhone" hint="Optional">
            <Input id="adminPhone" name="phone" type="tel" />
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">Roles</legend>
            {state.fieldErrors?.roleCodes && (
              <p role="alert" className="mb-2 text-xs font-medium text-critical">
                {state.fieldErrors.roleCodes}
              </p>
            )}
            <div className="space-y-2">
              {roles.map((role) => (
                <Checkbox
                  key={role.id}
                  name="roleCodes"
                  value={role.code}
                  label={role.name}
                  description={`${role.permissions.length} permissions`}
                />
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create administrator</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function RoleAssignment({ account, roles }: { account: AdminAccount; roles: Role[] }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>(account.roles);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const save = () => {
    startTransition(async () => {
      const result = await updateAdministratorRolesAction(account.id, selected);
      if (result.status === 'error') toast.error('Roles not updated', result.message);
      else toast.success(result.message ?? 'Roles updated.');
      setOpen(false);
    });
  };

  return (
    <>
      <Button variant="link" className="text-xs" onClick={() => setOpen(true)}>
        Change
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Roles for ${account.fullName}`}
        description="Removing a permission takes effect immediately, even on an existing session."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={pending} disabled={selected.length === 0}>
              Save roles
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {roles.map((role) => (
            <Checkbox
              key={role.id}
              checked={selected.includes(role.code)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked ? [...current, role.code] : current.filter((code) => code !== role.code),
                )
              }
              label={role.name}
              description={role.description ?? `${role.permissions.length} permissions`}
            />
          ))}
          {selected.length === 0 && (
            <p className="text-xs font-medium text-critical">An administrator must keep at least one role.</p>
          )}
        </div>
      </Dialog>
    </>
  );
}
