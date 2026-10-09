import * as React from 'react';
import { cn } from './utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-55';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent-hover shadow-subtle',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-sunken',
  ghost: 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
  danger: 'bg-critical text-white hover:brightness-95 shadow-subtle',
  link: 'text-accent underline underline-offset-4 hover:text-accent-hover',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], variant !== 'link' && sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
});

export function Spinner({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(base, variants[variant], 'h-9 w-9 shrink-0 p-0', className)}
      {...props}
    >
      {children}
    </button>
  );
});
