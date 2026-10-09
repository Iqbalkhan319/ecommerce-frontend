'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ApiError, endpoints } from '@ecom/api-client';
import type { AuthSession } from '@ecom/types';
import { toFormState, type FormState } from '../form-state';
import { api, clearSession, getAccessToken, persistSession, readRefreshToken } from '../session';

export async function loginAction(_previous: FormState, formData: FormData): Promise<FormState> {
  try {
    const session = await api.post<AuthSession>(endpoints.auth.login, {
      email: String(formData.get('email') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
      // A customer account can never obtain an administrator session.
      scope: 'ADMIN' as const,
    });
    await persistSession(session.tokens);
  } catch (error) {
    // A shopper's account is rejected here by design; say where it does work.
    if (error instanceof ApiError && error.isForbidden) {
      return {
        status: 'error',
        message: 'That is a customer account. Shoppers sign in on the storefront, not the console.',
      };
    }
    return toFormState(error);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  const token = await getAccessToken();
  const refreshToken = await readRefreshToken();
  if (token) {
    await api.post(endpoints.auth.logout, { refreshToken: refreshToken ?? undefined }, { token }).catch(() => undefined);
  }
  await clearSession();
  redirect('/login');
}

export async function changePasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const newPassword = String(formData.get('newPassword') ?? '');
  if (newPassword !== String(formData.get('confirmPassword') ?? '')) {
    return { status: 'error', fieldErrors: { confirmPassword: 'The two passwords do not match' } };
  }

  try {
    await api.post(
      endpoints.auth.changePassword,
      { currentPassword: String(formData.get('currentPassword') ?? ''), newPassword },
      { token },
    );
  } catch (error) {
    return toFormState(error);
  }

  await clearSession();
  redirect('/login?reason=password-changed');
}
