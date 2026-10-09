'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert, Button, Card, CardBody, Field, Input } from '@ecom/ui';
import { loginAction } from '@/lib/actions/auth';
import { initialFormState } from '@/lib/form-state';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth size="lg" loading={pending}>
      Sign in
    </Button>
  );
}

export function LoginForm({ reason }: { reason?: string }) {
  const [state, formAction] = useActionState(loginAction, initialFormState);

  return (
    <Card>
      <CardBody>
        {reason === 'password-changed' && (
          <Alert tone="positive" className="mb-4">
            Your password was changed. Please sign in again.
          </Alert>
        )}

        <form action={formAction} className="space-y-4" noValidate>
          {state.status === 'error' && state.message && (
            <Alert tone="critical" title="Sign-in failed">
              {state.message}
            </Alert>
          )}

          <Field label="Email address" htmlFor="email" required error={state.fieldErrors?.email}>
            <Input id="email" name="email" type="email" required autoComplete="username" autoFocus />
          </Field>

          <Field label="Password" htmlFor="password" required error={state.fieldErrors?.password}>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </Field>

          <Submit />
        </form>
      </CardBody>
    </Card>
  );
}
