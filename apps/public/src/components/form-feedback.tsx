'use client';

import { useFormStatus } from 'react-dom';
import { Alert, Button, type ButtonProps } from '@ecom/ui';
import type { FormState } from '@/lib/form-state';

export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  );
}

export function FormFeedback({ state }: { state: FormState }) {
  if (state.status === 'error' && state.message) {
    return (
      <Alert tone="critical" title="That did not work">
        {state.message}
      </Alert>
    );
  }
  if (state.status === 'success' && state.message) {
    return <Alert tone="positive">{state.message}</Alert>;
  }
  return null;
}
