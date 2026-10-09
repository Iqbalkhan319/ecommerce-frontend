import Link from 'next/link';
import { BrandMark, OwnerBadge } from '@ecom/ui';
import { brand, owner, publicEnv } from '@/lib/env';

const columns = [
  {
    heading: 'Shop',
    links: [
      { href: '/products', label: 'All products' },
      { href: '/categories', label: 'Categories' },
      { href: '/products?inStock=true', label: 'In stock now' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { href: '/account', label: 'Your account' },
      { href: '/account/orders', label: 'Order history' },
      { href: '/account/addresses', label: 'Saved addresses' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { href: '/help/delivery', label: 'Delivery and returns' },
      { href: '/help/contact', label: 'Contact us' },
      { href: '/help/terms', label: 'Terms of sale' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandMark identity={brand} textClassName="font-display text-lg text-ink" />
          <p className="prose-copy mt-2">
            A small catalogue, chosen slowly. Orders are placed without an online payment and settled separately.
          </p>
          {owner.name && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-2xs uppercase tracking-[0.14em] text-ink-muted">Founded by</p>
              <OwnerBadge owner={owner} size="sm" className="mt-2.5" />
            </div>
          )}
        </div>
        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">{column.heading}</h2>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-soft transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-ink-muted">
          <p>
            © {new Date().getFullYear()} {publicEnv.siteName}. Prices shown in {publicEnv.currency}.
          </p>
          <p>Built as a demonstration platform. No real payment is taken.</p>
        </div>
      </div>
    </footer>
  );
}
