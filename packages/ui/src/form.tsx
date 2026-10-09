import * as React from 'react';
import { cn } from './utils';

const control =
  'w-full rounded border border-line-strong bg-surface px-3 text-ink placeholder:text-ink-muted ' +
  'transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted ' +
  'aria-[invalid=true]:border-critical aria-[invalid=true]:focus:ring-critical/25';

export interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Wires the label, hint and error to the control with the right ARIA attributes, so an
// error is announced by a screen reader rather than only shown in red.
export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-1 text-critical" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-critical">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, 'h-10', className)} aria-invalid={invalid || undefined} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(control, 'py-2 leading-relaxed', className)}
        aria-invalid={invalid || undefined}
        {...props}
      />
    );
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(control, 'h-10 pr-8', className)} aria-invalid={invalid || undefined} {...props}>
        {children}
      </select>
    );
  },
);

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, id, ...props },
  ref,
) {
  const inputId = id ?? React.useId();
  return (
    <div className={cn('flex gap-2.5', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-line-strong text-accent focus:ring-2 focus:ring-accent/40"
        {...props}
      />
      <div className="text-sm">
        <label htmlFor={inputId} className="font-medium text-ink">
          {label}
        </label>
        {description && <p className="text-xs text-ink-muted">{description}</p>}
      </div>
    </div>
  );
});

export function Fieldset({ legend, children, className }: { legend: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={cn('space-y-4', className)}>
      <legend className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{legend}</legend>
      {children}
    </fieldset>
  );
}
