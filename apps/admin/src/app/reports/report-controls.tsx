'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Select } from '@ecom/ui';

const PRESETS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
];

const GRANULARITIES = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

// The range lives in the URL so a report can be bookmarked and shared, and so a reload
// shows exactly the same figures. Presets write concrete dates rather than a relative
// token, which keeps a shared link stable tomorrow.
export function ReportControls({ granularity, days }: { granularity: string; days: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const apply = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  return (
    <div className="flex flex-wrap items-end gap-3" aria-busy={pending}>
      <div>
        <label htmlFor="report-range" className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-ink-muted">
          Period
        </label>
        <Select
          id="report-range"
          value={days}
          onChange={(event) => apply({ days: event.target.value })}
          className="w-44"
        >
          {PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label
          htmlFor="report-granularity"
          className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Grouped by
        </label>
        <Select
          id="report-granularity"
          value={granularity}
          onChange={(event) => apply({ granularity: event.target.value })}
          className="w-36"
        >
          {GRANULARITIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {pending && <span className="pb-2 text-xs text-ink-muted">Updating…</span>}
    </div>
  );
}

export function ExportMenu({
  exports,
  disabledReason,
}: {
  exports: Array<{ href: string; label: string }>;
  disabledReason?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

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

  if (disabledReason) {
    return (
      <Button variant="secondary" disabled title={disabledReason}>
        Export CSV
      </Button>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="secondary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Export CSV
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-overlay"
        >
          {exports.map((entry) => (
            <a
              key={entry.href}
              href={entry.href}
              role="menuitem"
              download
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-ink-soft hover:bg-surface-sunken hover:text-ink"
            >
              {entry.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
