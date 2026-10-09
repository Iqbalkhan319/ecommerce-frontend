'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ApiError, endpoints } from '@ecom/api-client';
import type { AuthSession } from '@ecom/types';
import { toFormState, type FormState } from '../form-state';
import { api, clearSession, getAccessToken, persistSession, readRefreshToken } from '../session';

export async function registerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const payload = {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    fullName: String(formData.get('fullName') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
  };

  try {
    const session = await api.post<AuthSession>(endpoints.auth.register, payload);
    await persistSession(session.tokens);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/', 'layout');
  redirect('/account');
}

export async function loginAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const redirectTo = String(formData.get('redirectTo') ?? '/account');
  const payload = {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    scope: 'CUSTOMER' as const,
  };

  try {
    const session = await api.post<AuthSession>(endpoints.auth.login, payload);
    await persistSession(session.tokens);
  } catch (error) {
    // Staff accounts are valid credentials that simply belong to the other portal, and
    // the API's "requested portal" wording gives a shopper nothing to act on.
    if (error instanceof ApiError && error.isForbidden) {
      return {
        status: 'error',
        message: 'That is a staff account. Administrators sign in to the operations console, not the shop.',
      };
    }
    return toFormState(error);
  }

  revalidatePath('/', 'layout');
  // Only ever redirect within this site: an attacker-supplied absolute URL is ignored.
  redirect(redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/account');
}

export async function logoutAction(): Promise<void> {
  const token = await getAccessToken();
  const refreshToken = await readRefreshToken();

  if (token) {
    await api.post(endpoints.auth.logout, { refreshToken: refreshToken ?? undefined }, { token }).catch(() => undefined);
  }

  await clearSession();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function changePasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (newPassword !== confirmPassword) {
    return { status: 'error', fieldErrors: { confirmPassword: 'The two passwords do not match' } };
  }

  try {
    await api.post(endpoints.auth.changePassword, { currentPassword, newPassword }, { token });
  } catch (error) {
    return toFormState(error);
  }

  // Changing a password revokes every session, so the customer must sign in again.
  await clearSession();
  redirect('/login?reason=password-changed');
}

export async function requestPasswordResetAction(_previous: FormState, formData: FormData): Promise<FormState> {
  try {
    await api.post(endpoints.auth.forgotPassword, { email: String(formData.get('email') ?? '').trim() });
  } catch (error) {
    return toFormState(error);
  }
  return {
    status: 'success',
    message: 'If that address has an account, a reset link is on its way.',
  };
}
