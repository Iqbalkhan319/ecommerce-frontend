'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Alert, Card, CardBody, Field, Input } from '@ecom/ui';
import { FormFeedback, SubmitButton } from '@/components/form-feedback';
import { loginAction } from '@/lib/actions/auth';
import { initialFormState } from '@/lib/form-state';

export function LoginForm({ redirectTo, reason }: { redirectTo?: string; reason?: string }) {
  const [state, formAction] = useActionState(loginAction, initialFormState);

  return (
    <Card className="mt-8">
      <CardBody>
        {reason === 'password-changed' && (
          <Alert tone="positive" className="mb-4">
            Your password was changed. Please sign in again.
          </Alert>
        )}

        {reason === 'basket' && (
          <Alert tone="info" className="mb-4">
            Sign in to keep items in your basket. Your selection is waiting on the product page.
          </Alert>
        )}

        {reason === 'session-expired' && (
          <Alert tone="caution" className="mb-4">
            Your session expired. Please sign in again.
          </Alert>
        )}

        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="redirectTo" value={redirectTo ?? '/account'} />
          <FormFeedback state={state} />

          <Field label="Email address" htmlFor="email" required error={state.fieldErrors?.email}>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              invalid={Boolean(state.fieldErrors?.email)}
            />
          </Field>

          <Field label="Password" htmlFor="password" required error={state.fieldErrors?.password}>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              invalid={Boolean(state.fieldErrors?.password)}
            />
          </Field>

          <SubmitButton fullWidth size="lg">
            Sign in
          </SubmitButton>

          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-ink-muted underline underline-offset-4 hover:text-ink">
              Forgotten your password?
            </Link>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
