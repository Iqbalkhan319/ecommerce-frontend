import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

const NAV = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/security', label: 'Password' },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirectTo=%2Faccount');

  return (
    <div className="shell py-10">
      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <aside>
          <p className="font-display text-lg text-ink">{user.fullName}</p>
          <p className="truncate text-sm text-ink-muted">{user.email}</p>
          <nav aria-label="Account" className="mt-5 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
