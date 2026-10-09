'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ecom/ui';

export function NavLinks({
  items,
  horizontal = false,
}: {
  items: Array<{ href: string; label: string }>;
  horizontal?: boolean;
}) {
  const pathname = usePathname();

  return (
    <ul className={cn(horizontal ? 'flex gap-1 overflow-x-auto' : 'space-y-0.5')}>
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'block whitespace-nowrap rounded px-3 py-2 text-sm transition-colors',
                active ? 'bg-accent-soft font-medium text-accent' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
