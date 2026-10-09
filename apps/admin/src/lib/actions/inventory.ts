'use server';

import { revalidatePath } from 'next/cache';
import { endpoints } from '@ecom/api-client';
import { api, getAccessToken } from '../session';
import { toFormState, type FormState } from '../form-state';
import type { StockMovementReason } from '@ecom/types';

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function number(formData: FormData, key: string): number | undefined {
  const raw = text(formData, key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

// The form offers both ways of expressing a movement. Only the one the operator filled in
// is forwarded; the service rejects a payload carrying both.
export async function recordStockMovementAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const productId = text(formData, 'productId');
  const reason = text(formData, 'reason') as StockMovementReason;
  const mode = text(formData, 'mode');
  const note = text(formData, 'note');

  if (!productId || !reason) {
    return { status: 'error', message: 'Choose a product and a reason.' };
  }

  const quantity = number(formData, 'quantity');
  if (quantity === undefined) {
    return { status: 'error', fieldErrors: { quantity: 'Enter a quantity.' } };
  }

  const removes = reason === 'DAMAGE' || reason === 'LOSS';

  const payload =
    mode === 'count'
      ? { reason, quantityAfter: quantity, note: note || undefined }
      : { reason, delta: removes ? -Math.abs(quantity) : Math.abs(quantity), note: note || undefined };

  try {
    await api.post(endpoints.admin.productMovements(productId), payload, { token });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/inventory');
  revalidatePath('/products');
  return { status: 'success', message: 'Stock movement recorded.' };
}

export async function updateStockSettingsAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const productId = text(formData, 'productId');
  const lowStockThreshold = number(formData, 'lowStockThreshold');
  const costPrice = number(formData, 'costPrice');

  if (lowStockThreshold === undefined && costPrice === undefined) {
    return { status: 'error', message: 'Change a threshold or a cost price before saving.' };
  }

  try {
    await api.patch(
      endpoints.admin.productStockSettings(productId),
      {
        ...(lowStockThreshold === undefined ? {} : { lowStockThreshold }),
        ...(costPrice === undefined ? {} : { costPrice }),
      },
      { token },
    );
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/inventory');
  return { status: 'success', message: 'Stock settings updated.' };
}
