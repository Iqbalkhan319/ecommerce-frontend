import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = { title: 'Reset your password', robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="shell flex justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter the address on your account and we will send a reset link.
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-accent underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
