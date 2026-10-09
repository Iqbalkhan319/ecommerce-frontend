import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/account');

  return (
    <div className="shell flex justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-ink">Create an account</h1>
        <p className="mt-1 text-sm text-ink-muted">It takes a moment and keeps your orders in one place.</p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Already registered?{' '}
          <Link href="/login" className="text-accent underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
