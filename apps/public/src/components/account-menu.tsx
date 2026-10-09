'use client';

import * as React from 'react';
import Link from 'next/link';
import type { AuthenticatedUser } from '@ecom/types';
import { logoutAction } from '@/lib/actions/auth';

export function AccountMenu({ user }: { user: AuthenticatedUser | null }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center rounded border border-line-strong px-3 text-sm text-ink transition-colors hover:bg-surface-sunken"
      >
        Sign in
      </Link>
    );
  }

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-9 items-center gap-2 rounded px-2 text-sm text-ink transition-colors hover:bg-surface-sunken"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-2xs font-semibold text-accent">
          {initials || 'A'}
        </span>
        <span className="hidden max-w-24 truncate sm:inline">{user.fullName.split(' ')[0]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-56 animate-fade-up rounded-lg border border-line bg-surface p-1.5 shadow-raised"
        >
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">{user.fullName}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          {[
            { href: '/account', label: 'Account overview' },
            { href: '/account/orders', label: 'Orders' },
            { href: '/account/addresses', label: 'Addresses' },
            { href: '/account/security', label: 'Password' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <form action={logoutAction} className="border-t border-line pt-1.5">
            <button
              type="submit"
              role="menuitem"
              className="w-full rounded px-3 py-2 text-left text-sm text-critical transition-colors hover:bg-critical/10"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
