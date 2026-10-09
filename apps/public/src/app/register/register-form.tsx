'use client';

import { useActionState } from 'react';
import { Card, CardBody, Field, Input } from '@ecom/ui';
import { FormFeedback, SubmitButton } from '@/components/form-feedback';
import { registerAction } from '@/lib/actions/auth';
import { initialFormState } from '@/lib/form-state';

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialFormState);

  return (
    <Card className="mt-8">
      <CardBody>
        <form action={formAction} className="space-y-4" noValidate>
          <FormFeedback state={state} />

          <Field label="Full name" htmlFor="fullName" required error={state.fieldErrors?.fullName}>
            <Input id="fullName" name="fullName" required autoComplete="name" autoFocus invalid={Boolean(state.fieldErrors?.fullName)} />
          </Field>

          <Field label="Email address" htmlFor="email" required error={state.fieldErrors?.email}>
            <Input id="email" name="email" type="email" required autoComplete="email" invalid={Boolean(state.fieldErrors?.email)} />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            required
            hint="At least 10 characters, with an upper case letter, a lower case letter and a digit"
            error={state.fieldErrors?.password}
          >
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              invalid={Boolean(state.fieldErrors?.password)}
            />
          </Field>

          <Field label="Phone" htmlFor="phone" hint="Optional. Used only for delivery questions.">
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </Field>

          <SubmitButton fullWidth size="lg">
            Create account
          </SubmitButton>
        </form>
      </CardBody>
    </Card>
  );
}
