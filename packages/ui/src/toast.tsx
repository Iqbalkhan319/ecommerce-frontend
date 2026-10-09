'use client';

import * as React from 'react';
import { cn } from './utils';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, string> = {
  success: 'border-positive/30 bg-positive/10 text-positive',
  error: 'border-critical/30 bg-critical/10 text-critical',
  info: 'border-line-strong bg-surface text-ink',
};

export function ToastProvider({ children, duration = 5000 }: { children: React.ReactNode; duration?: number }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = React.useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((current) => [...current.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss, duration],
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toasts,
      push,
      dismiss,
      success: (title, description) => push({ tone: 'success', title, description }),
      error: (title, description) => push({ tone: 'error', title, description }),
    }),
    [toasts, push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Announced politely so a screen reader hears the outcome without losing focus. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto w-full max-w-sm animate-fade-up rounded-lg border px-4 py-3 shadow-raised',
              toneStyles[toast.tone],
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm">
                <p className="font-semibold">{toast.title}</p>
                {toast.description && <p className="mt-0.5 opacity-80">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded px-1 text-lg leading-none opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}
