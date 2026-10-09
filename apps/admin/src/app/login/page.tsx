import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { BrandMark, OwnerBadge } from '@ecom/ui';
import { LoginForm } from './login-form';
import { brand, owner } from '@/lib/env';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  if (await getCurrentUser()) redirect('/');

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark identity={brand} textClassName="font-display text-2xl text-ink" logoClassName="h-10" />
          <p className="mt-0.5 text-2xs uppercase tracking-[0.18em] text-ink-muted">Administration</p>
          {owner.name && (
            <OwnerBadge
              owner={owner}
              size="lg"
              orientation="vertical"
              loading="eager"
              className="mt-6"
            />
          )}
        </div>
        <LoginForm reason={reason} />
        <p className="mt-6 text-center text-xs text-ink-muted">
          Administrator accounts only. Customer sign-in is on the storefront.
        </p>
      </div>
    </div>
  );
}
