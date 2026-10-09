'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert, Button, Field, Input } from '@ecom/ui';
import { changePasswordAction } from '@/lib/actions/auth';
import { initialFormState } from '@/lib/form-state';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Change password
    </Button>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === 'error' && state.message && (
        <Alert tone="critical" title="Not changed">
          {state.message}
        </Alert>
      )}

      <Field label="Current password" htmlFor="currentPassword" required error={state.fieldErrors?.currentPassword}>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
      </Field>
      <Field
        label="New password"
        htmlFor="newPassword"
        required
        hint="At least 10 characters with upper case, lower case and a digit"
        error={state.fieldErrors?.newPassword}
      >
        <Input id="newPassword" name="newPassword" type="password" required minLength={10} autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" required error={state.fieldErrors?.confirmPassword}>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
      </Field>

      <Submit />
    </form>
  );
}
