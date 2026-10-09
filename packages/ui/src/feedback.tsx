import * as React from 'react';
import { cn } from './utils';

type Tone = 'neutral' | 'positive' | 'caution' | 'critical' | 'info' | 'accent';

const toneStyles: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-ink-soft border-line',
  positive: 'bg-positive/10 text-positive border-positive/25',
  caution: 'bg-caution/12 text-caution border-caution/30',
  critical: 'bg-critical/10 text-critical border-critical/25',
  info: 'bg-info/10 text-info border-info/25',
  accent: 'bg-accent-soft text-accent border-accent/25',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wide',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const ORDER_STATUS_TONE: Record<string, Tone> = {
  PENDING: 'caution',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'accent',
  DELIVERED: 'positive',
  REJECTED: 'critical',
  CANCELLED: 'neutral',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Awaiting confirmation',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Being prepared',
  SHIPPED: 'On its way',
  DELIVERED: 'Delivered',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export function OrderStatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  return (
    <Badge tone={ORDER_STATUS_TONE[status] ?? 'neutral'}>
      {compact ? status.toLowerCase() : (ORDER_STATUS_LABEL[status] ?? status)}
    </Badge>
  );
}

export function StockBadge({ stock, threshold = 5 }: { stock: number; threshold?: number }) {
  if (stock <= 0) return <Badge tone="critical">Out of stock</Badge>;
  if (stock <= threshold) return <Badge tone="caution">Only {stock} left</Badge>;
  return <Badge tone="positive">In stock</Badge>;
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
  onDismiss,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-4 py-3 text-sm', toneStyles[tone], className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={cn(title && 'mt-0.5', 'text-ink-soft')}>{children}</div>}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded px-1 text-lg leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden rounded bg-surface-sunken', className)}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-black/[0.04] to-transparent" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading content">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-3.5', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-14 text-center', className)}>
      {icon && <div className="mb-4 text-ink-muted">{icon}</div>}
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-prose text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div role="alert" className="rounded-xl border border-critical/25 bg-critical/5 px-6 py-10 text-center">
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
