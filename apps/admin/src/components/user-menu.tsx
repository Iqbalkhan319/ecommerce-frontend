'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@ecom/ui';
import type { AuthenticatedUser } from '@ecom/types';
import { logoutAction } from '@/lib/actions/auth';

export function UserMenu({ user }: { user: AuthenticatedUser }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-surface-sunken"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-2xs font-semibold text-accent">
          {user.fullName.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{user.fullName}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-11 z-50 w-64 rounded-lg border border-line bg-surface p-1.5 shadow-raised">
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">{user.fullName}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {user.isSuperAdmin ? (
                <Badge tone="accent">Super administrator</Badge>
              ) : (
                user.roles.map((role) => (
                  <Badge key={role} tone="neutral">
                    {role.toLowerCase()}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded px-3 py-2 text-sm text-ink-soft hover:bg-surface-sunken hover:text-ink"
          >
            Your settings
          </Link>
          <form action={logoutAction} className="border-t border-line pt-1.5">
            <button
              type="submit"
              role="menuitem"
              className="w-full rounded px-3 py-2 text-left text-sm text-critical hover:bg-critical/10"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
