'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ecom/ui';

/**
 * Navigation for narrow screens.
 *
 * A horizontally scrolling strip hides most of the sections behind a gesture with no
 * affordance, so below the sidebar breakpoint the sections open as a sheet instead: the
 * whole list is visible at once, focus is trapped while it is open, Escape closes it, and
 * the page behind it cannot scroll.
 */
export function MobileNav({ items }: { items: Array<{ href: string; label: string }> }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Any navigation closes the sheet, including a click on the section already showing.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const current = items.find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
  );

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-sections"
        className="flex w-full items-center gap-2 border-b border-line bg-surface px-4 py-3 text-left text-sm text-ink-soft"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current">
          <path d="M2 4.5h16v1.6H2zM2 9.2h16v1.6H2zM2 13.9h16v1.6H2z" />
        </svg>
        <span className="font-medium text-ink">{current?.label ?? 'Sections'}</span>
        <span className="ml-auto text-2xs uppercase tracking-wide text-ink-muted">Menu</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close the section menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            ref={panelRef}
            id="mobile-sections"
            role="dialog"
            aria-modal="true"
            aria-label="Sections"
            className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] animate-fade-up flex-col border-r border-line bg-surface"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-display text-base text-ink">Sections</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded px-2 py-1 text-lg leading-none text-ink-muted hover:bg-surface-sunken hover:text-ink"
              >
                ×
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'block rounded px-3 py-2.5 text-sm transition-colors',
                          active
                            ? 'bg-accent-soft font-medium text-accent'
                            : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
