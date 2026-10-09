'use client';

import { useActionState } from 'react';
import { Checkbox, Field, Input } from '@ecom/ui';
import { FormFeedback, SubmitButton } from '@/components/form-feedback';
import { updateProfileAction } from '@/lib/actions/account';
import { initialFormState } from '@/lib/form-state';
import type { CustomerProfile } from '@ecom/types';

export function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const [state, formAction] = useActionState(updateProfileAction, initialFormState);

  return (
    <form action={formAction} className="space-y-4">
      <FormFeedback state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" required error={state.fieldErrors?.fullName}>
          <Input id="fullName" name="fullName" defaultValue={profile.fullName} required autoComplete="name" />
        </Field>
        <Field label="Phone" htmlFor="phone" hint="Optional">
          <Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ''} autoComplete="tel" />
        </Field>
      </div>

      <Field label="Email address" htmlFor="email" hint="Contact us if you need to change the address on your account.">
        <Input id="email" defaultValue={profile.email} disabled readOnly />
      </Field>

      <Checkbox
        name="marketingOptIn"
        defaultChecked={profile.marketingOptIn}
        label="Send me occasional updates"
        description="A short note when something new arrives. Never more than once a month."
      />

      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
