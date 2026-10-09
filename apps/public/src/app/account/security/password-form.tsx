'use client';

import { useActionState } from 'react';
import { Field, Input } from '@ecom/ui';
import { FormFeedback, SubmitButton } from '@/components/form-feedback';
import { changePasswordAction } from '@/lib/actions/auth';
import { initialFormState } from '@/lib/form-state';

export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormFeedback state={state} />

      <Field label="Current password" htmlFor="currentPassword" required error={state.fieldErrors?.currentPassword}>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
      </Field>

      <Field
        label="New password"
        htmlFor="newPassword"
        required
        hint="At least 10 characters, with an upper case letter, a lower case letter and a digit"
        error={state.fieldErrors?.newPassword}
      >
        <Input id="newPassword" name="newPassword" type="password" required minLength={10} autoComplete="new-password" />
      </Field>

      <Field label="Confirm new password" htmlFor="confirmPassword" required error={state.fieldErrors?.confirmPassword}>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
      </Field>

      <SubmitButton>Change password</SubmitButton>
    </form>
  );
}
