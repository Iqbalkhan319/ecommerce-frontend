import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OwnerBadge } from '@ecom/ui';
import { getCurrentUser } from '@/lib/session';
import { owner } from '@/lib/env';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; reason?: string }>;
}) {
  const params = await searchParams;
  if (await getCurrentUser()) redirect(params.redirectTo ?? '/account');

  return (
    <div className="shell flex justify-center py-16">
      <div className="w-full max-w-md">
        {owner.name && (
          <OwnerBadge owner={owner} size="md" loading="eager" className="mb-6 border-b border-line pb-6" />
        )}
        <h1 className="font-display text-3xl text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">Your basket and order history are waiting.</p>
        <LoginForm redirectTo={params.redirectTo} reason={params.reason} />
        <p className="mt-6 text-center text-sm text-ink-muted">
          No account yet?{' '}
          <Link href="/register" className="text-accent underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
