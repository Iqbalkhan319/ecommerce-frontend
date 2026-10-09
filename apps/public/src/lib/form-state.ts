import { ApiError } from '@ecom/api-client';

// Shared shape for server-action results.
//
// This deliberately lives outside any 'use server' module: such a module may only export
// async functions, so plain helpers and constants belong here.
export interface FormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const initialFormState: FormState = { status: 'idle' };

export function toFormState(error: unknown): FormState {
  if (error instanceof ApiError) {
    return {
      status: 'error',
      message: error.message,
      fieldErrors: Object.keys(error.fieldErrors).length > 0 ? error.fieldErrors : undefined,
    };
  }
  return { status: 'error', message: 'Something went wrong. Please try again.' };
}
