import * as React from 'react';
import { cn } from './utils';

export function Card({
  className,
  children,
  as: Component = 'div',
}: {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return (
    <Component className={cn('rounded-xl border border-line bg-surface shadow-subtle', className)}>
      {children}
    </Component>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div>
        <h2 className="font-display text-lg text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumb,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      {breadcrumb}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-prose text-sm text-ink-muted">{description}</p>}
        </div>
        {action && <div className="flex flex-wrap gap-2">{action}</div>}
      </div>
    </header>
  );
}

// A table that stays usable on a narrow screen: it scrolls inside its own container
// rather than forcing the page to scroll sideways.
export function TableShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-line bg-surface', className)}>
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({
  className,
  children,
  scope = 'col',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope}
      className={cn(
        'border-b border-line bg-surface-sunken px-4 py-3 text-2xs font-semibold uppercase tracking-wide text-ink-muted',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('border-b border-line px-4 py-3 align-middle text-ink', className)} {...props}>
      {children}
    </td>
  );
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  buildHref,
  className,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  buildHref: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) {
    return (
      <p className={cn('px-1 py-3 text-sm text-ink-muted', className)}>
        {totalItems} {totalItems === 1 ? 'result' : 'results'}
      </p>
    );
  }

  const window = 2;
  const pages: Array<number | 'gap'> = [];
  for (let candidate = 1; candidate <= totalPages; candidate += 1) {
    if (candidate === 1 || candidate === totalPages || Math.abs(candidate - page) <= window) {
      pages.push(candidate);
    } else if (pages[pages.length - 1] !== 'gap') {
      pages.push('gap');
    }
  }

  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-between gap-3 py-4', className)}>
      <p className="text-sm text-ink-muted">
        Page {page} of {totalPages} · {totalItems} {totalItems === 1 ? 'result' : 'results'}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          <a
            href={page > 1 ? buildHref(page - 1) : undefined}
            aria-disabled={page === 1}
            className={cn(
              'inline-flex h-9 items-center rounded px-3 text-sm',
              page === 1 ? 'pointer-events-none text-ink-muted opacity-50' : 'text-ink-soft hover:bg-surface-sunken',
            )}
          >
            Previous
          </a>
        </li>
        {pages.map((entry, index) =>
          entry === 'gap' ? (
            <li key={`gap-${index}`} className="px-1 text-ink-muted" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={entry}>
              <a
                href={buildHref(entry)}
                aria-current={entry === page ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 min-w-9 items-center justify-center rounded px-2.5 text-sm',
                  entry === page ? 'bg-accent text-accent-contrast' : 'text-ink-soft hover:bg-surface-sunken',
                )}
              >
                {entry}
              </a>
            </li>
          ),
        )}
        <li>
          <a
            href={page < totalPages ? buildHref(page + 1) : undefined}
            aria-disabled={page === totalPages}
            className={cn(
              'inline-flex h-9 items-center rounded px-3 text-sm',
              page === totalPages
                ? 'pointer-events-none text-ink-muted opacity-50'
                : 'text-ink-soft hover:bg-surface-sunken',
            )}
          >
            Next
          </a>
        </li>
      </ul>
    </nav>
  );
}

export function DescriptionList({ items }: { items: Array<{ term: string; detail: React.ReactNode }> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.term}>
          <dt className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">{item.term}</dt>
          <dd className="mt-0.5 text-sm text-ink">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
