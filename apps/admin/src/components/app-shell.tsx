import Link from 'next/link';
import { BrandMark } from '@ecom/ui';
import { NavLinks } from './nav-links';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';
import { NAVIGATION, can } from '@/lib/permissions';
import { brand, publicEnv } from '@/lib/env';
import type { AuthenticatedUser } from '@ecom/types';

export function AppShell({ user, children }: { user: AuthenticatedUser; children: React.ReactNode }) {
  // The navigation only lists what this account may actually open. The server enforces
  // the same rules, so a hidden entry is convenience rather than protection.
  const items = NAVIGATION.filter((item) => !item.permission || can(user, item.permission));

  return (
    <div className="min-h-dvh bg-paper">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label={`${brand.name} administration`}>
            <BrandMark
              identity={brand}
              textClassName="font-display text-lg text-ink"
              logoClassName="h-7"
              adornment={<span className="text-2xs uppercase tracking-[0.18em] text-ink-muted">Admin</span>}
            />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={publicEnv.storefrontUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="hidden text-sm text-ink-muted hover:text-ink sm:inline"
            >
              View storefront ↗
            </a>
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden w-[--sidebar-width] shrink-0 border-r border-line bg-surface lg:block">
          <nav aria-label="Sections" className="sticky top-14 p-3">
            <NavLinks items={items} />
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <MobileNav items={items} />
          <main id="main" className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
