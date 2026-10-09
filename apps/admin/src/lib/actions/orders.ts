'use server';

import { revalidatePath } from 'next/cache';
import { endpoints } from '@ecom/api-client';
import { api, getAccessToken } from '../session';
import { toFormState, type FormState } from '../form-state';

async function withToken(operation: (token: string) => Promise<void>, paths: string[]): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  try {
    await operation(token);
  } catch (error) {
    return toFormState(error);
  }

  for (const path of paths) revalidatePath(path);
  return { status: 'success' };
}

export async function confirmOrderAction(orderId: string, note?: string): Promise<FormState> {
  const result = await withToken(
    async (token) => {
      await api.post(endpoints.admin.orderConfirm(orderId), { note }, { token });
    },
    ['/orders', `/orders/${orderId}`, '/'],
  );
  return result.status === 'success' ? { ...result, message: 'Order confirmed. The invoice is being prepared.' } : result;
}

export async function rejectOrderAction(orderId: string, reason: string): Promise<FormState> {
  const result = await withToken(
    async (token) => {
      await api.post(endpoints.admin.orderReject(orderId), { reason }, { token });
    },
    ['/orders', `/orders/${orderId}`, '/'],
  );
  return result.status === 'success'
    ? { ...result, message: 'Order rejected and the stock returned to the catalogue.' }
    : result;
}

export async function updateOrderStatusAction(orderId: string, status: string, reason?: string): Promise<FormState> {
  const result = await withToken(
    async (token) => {
      await api.patch(endpoints.admin.orderStatus(orderId), { status, reason }, { token });
    },
    ['/orders', `/orders/${orderId}`],
  );
  return result.status === 'success' ? { ...result, message: `Order moved to ${status.toLowerCase()}.` } : result;
}

export async function updateOrderNoteAction(orderId: string, internalNote: string): Promise<FormState> {
  const result = await withToken(
    async (token) => {
      await api.patch(endpoints.admin.orderNote(orderId), { internalNote }, { token });
    },
    [`/orders/${orderId}`],
  );
  return result.status === 'success' ? { ...result, message: 'Note saved.' } : result;
}
