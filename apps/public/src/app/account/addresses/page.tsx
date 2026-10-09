import type { Metadata } from 'next';
import { Card, CardBody } from '@ecom/ui';
import { AddressManager } from './address-manager';
import { endpoints, gateway } from '@/lib/api';
import { requireUser } from '@/lib/session';
import type { CustomerProfile } from '@ecom/types';

export const metadata: Metadata = { title: 'Saved addresses', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AddressesPage() {
  const { token } = await requireUser();
  const profile = await gateway.get<CustomerProfile>(endpoints.storefront.profile, { token, cache: 'no-store' });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Saved addresses</h1>
      <p className="mt-1 text-sm text-ink-muted">Keep the places you order to, so checkout is one step shorter.</p>
      <Card className="mt-6">
        <CardBody>
          <AddressManager addresses={profile.addresses} defaultName={profile.fullName} />
        </CardBody>
      </Card>
    </div>
  );
}
