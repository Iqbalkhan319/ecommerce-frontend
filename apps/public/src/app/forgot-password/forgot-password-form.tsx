'use client';

import { useActionState } from 'react';
import { Card, CardBody, Field, Input } from '@ecom/ui';
import { FormFeedback, SubmitButton } from '@/components/form-feedback';
import { requestPasswordResetAction } from '@/lib/actions/auth';
import { initialFormState } from '@/lib/form-state';

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialFormState);

  return (
    <Card className="mt-8">
      <CardBody>
        <form action={formAction} className="space-y-4" noValidate>
          <FormFeedback state={state} />
          <Field label="Email address" htmlFor="email" required>
            <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
          </Field>
          <SubmitButton fullWidth>Send reset link</SubmitButton>
        </form>
      </CardBody>
    </Card>
  );
}
