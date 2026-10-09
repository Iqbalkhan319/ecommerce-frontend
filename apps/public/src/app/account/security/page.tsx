import type { Metadata } from 'next';
import { Card, CardBody } from '@ecom/ui';
import { PasswordForm } from './password-form';

export const metadata: Metadata = { title: 'Password', robots: { index: false } };

export default function SecurityPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Password</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Changing your password signs you out everywhere, including this device.
      </p>
      <Card className="mt-6 max-w-lg">
        <CardBody>
          <PasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
