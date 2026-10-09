'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Alert, Card, CardBody, Field, Input, Select, Textarea } from '@ecom/ui';
import { SubmitButton } from '@/components/form-feedback';
import { placeOrderAction } from '@/lib/actions/checkout';
import { initialFormState } from '@/lib/form-state';
import type { CustomerProfile } from '@ecom/types';

const COUNTRIES = [
  { code: 'BD', name: 'Bangladesh' },
  { code: 'SG', name: 'Singapore' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'IN', name: 'India' },
];

export function CheckoutForm({ profile, idempotencyKey }: { profile: CustomerProfile; idempotencyKey: string }) {
  const [state, formAction] = useActionState(placeOrderAction, initialFormState);
  const defaultAddress = profile.addresses.find((address) => address.isDefault) ?? profile.addresses[0];
  const [useSaved, setUseSaved] = React.useState(Boolean(defaultAddress));
  const [selectedId, setSelectedId] = React.useState(defaultAddress?.id ?? '');
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      {state.status === 'error' && state.message && (
        <Alert tone="critical" title="Your order was not placed">
          {state.message}
        </Alert>
      )}

      {profile.addresses.length > 0 && (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-display text-lg text-ink">Delivery address</h2>
            <div className="space-y-2">
              {profile.addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex cursor-pointer gap-3 rounded border border-line p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    value={address.id}
                    checked={useSaved && selectedId === address.id}
                    onChange={() => {
                      setUseSaved(true);
                      setSelectedId(address.id);
                    }}
                    className="mt-1 h-4 w-4 text-accent focus:ring-accent/40"
                  />
                  <span>
                    <span className="block font-medium text-ink">
                      {address.label} · {address.fullName}
                    </span>
                    <span className="block text-ink-muted">
                      {address.line1}, {address.city} {address.postalCode}, {address.country}
                    </span>
                  </span>
                </label>
              ))}

              <label className="flex cursor-pointer gap-3 rounded border border-line p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                <input
                  type="radio"
                  name="addressChoice"
                  value="new"
                  checked={!useSaved}
                  onChange={() => setUseSaved(false)}
                  className="mt-1 h-4 w-4 text-accent focus:ring-accent/40"
                />
                <span className="font-medium text-ink">Use a different address</span>
              </label>
            </div>
            {useSaved && <input type="hidden" name="savedAddressId" value={selectedId} />}
          </CardBody>
        </Card>
      )}

      {!useSaved && (
        <Card>
          <CardBody className="space-y-4">
            <h2 className="font-display text-lg text-ink">Where should it go?</h2>

            <Field label="Full name" htmlFor="fullName" required error={errors.fullName}>
              <Input id="fullName" name="fullName" defaultValue={profile.fullName} required autoComplete="name" invalid={Boolean(errors.fullName)} />
            </Field>

            <Field label="Address line 1" htmlFor="line1" required error={errors.line1}>
              <Input id="line1" name="line1" required autoComplete="address-line1" invalid={Boolean(errors.line1)} />
            </Field>

            <Field label="Address line 2" htmlFor="line2" hint="Optional">
              <Input id="line2" name="line2" autoComplete="address-line2" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" htmlFor="city" required error={errors.city}>
                <Input id="city" name="city" required autoComplete="address-level2" invalid={Boolean(errors.city)} />
              </Field>
              <Field label="State or region" htmlFor="state" hint="Optional">
                <Input id="state" name="state" autoComplete="address-level1" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Postcode" htmlFor="postalCode" required error={errors.postalCode}>
                <Input id="postalCode" name="postalCode" required autoComplete="postal-code" invalid={Boolean(errors.postalCode)} />
              </Field>
              <Field label="Country" htmlFor="country" required error={errors.country}>
                <Select id="country" name="country" defaultValue="BD" required autoComplete="country">
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Phone" htmlFor="phone" hint="Used only for delivery questions">
              <Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ''} autoComplete="tel" />
            </Field>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-4">
          <Field label="Note for the team" htmlFor="customerNote" hint="Optional. Delivery instructions, for example.">
            <Textarea id="customerNote" name="customerNote" rows={3} maxLength={500} />
          </Field>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton size="lg">Place order</SubmitButton>
        <p className="text-xs text-ink-muted">
          Placing an order does not take a payment. You will receive an invoice once it is confirmed.
        </p>
      </div>
    </form>
  );
}
