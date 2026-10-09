'use client';

import * as React from 'react';
import { useToast } from '@ecom/ui';
import type { FormState } from '@/lib/form-state';

// Surfaces the outcome of a server action as a toast, exactly once per outcome.
export function useActionToast(state: FormState) {
  const toast = useToast();
  const seen = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (state.status === 'idle') return;
    const signature = `${state.status}:${state.message ?? ''}`;
    if (signature === seen.current) return;
    seen.current = signature;

    if (state.status === 'success' && state.message) toast.success(state.message);
    if (state.status === 'error' && state.message) toast.error('That did not work', state.message);
  }, [state, toast]);
}

export function runWithToast(
  operation: () => Promise<FormState>,
  toast: ReturnType<typeof useToast>,
  successMessage?: string,
): Promise<boolean> {
  return operation().then((result) => {
    if (result.status === 'error') {
      toast.error('That did not work', result.message);
      return false;
    }
    toast.success(successMessage ?? result.message ?? 'Done.');
    return true;
  });
}
