import * as React from 'react';
import { cn } from './utils';

const SIZES = {
  sm: { box: 'h-9', step: 'w-8', value: 'w-9 text-sm' },
  md: { box: 'h-11', step: 'w-10', value: 'w-11 text-sm' },
} as const;

export type QuantitySize = keyof typeof SIZES;

/**
 * Stepper for a quantity. Presentational and uncontrolled-free: the owner holds the
 * value, so the same control serves a product card, a detail page and a basket line.
 *
 * The value is a live region rather than an input because the only legal values are
 * whole numbers within stock, and the two buttons already express that. A hidden input
 * carries the value when the stepper sits inside a form.
 */
export function QuantityStepper({
  value,
  min = 1,
  max,
  size = 'md',
  disabled = false,
  busy = false,
  name,
  label = 'Quantity',
  onChange,
  className,
}: {
  value: number;
  min?: number;
  max: number;
  size?: QuantitySize;
  disabled?: boolean;
  busy?: boolean;
  name?: string;
  label?: string;
  onChange: (next: number) => void;
  className?: string;
}) {
  const spec = SIZES[size];
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  const step = (delta: number) => {
    const next = value + delta;
    if (next < min || next > max) return;
    onChange(next);
  };

  const stepClasses = cn(
    spec.step,
    spec.box,
    'grid place-items-center text-base leading-none text-ink-soft transition-colors',
    'hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-inset focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40',
  );

  return (
    <div
      className={cn(
        'inline-flex select-none items-center overflow-hidden rounded-lg border border-line-strong bg-surface',
        spec.box,
        className,
      )}
      aria-busy={busy || undefined}
    >
      {name && <input type="hidden" name={name} value={value} />}
      <button type="button" className={stepClasses} onClick={() => step(-1)} disabled={!canDecrease} aria-label={`Decrease ${label.toLowerCase()}`}>
        <span aria-hidden="true">&minus;</span>
      </button>
      <span className={cn(spec.value, 'text-center font-medium tabular-nums text-ink')} aria-live="polite" aria-label={`${label}: ${value}`}>
        {value}
      </span>
      <button type="button" className={stepClasses} onClick={() => step(1)} disabled={!canIncrease} aria-label={`Increase ${label.toLowerCase()}`}>
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
