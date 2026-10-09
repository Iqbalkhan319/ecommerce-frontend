'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError, endpoints } from '@ecom/api-client';
import type { Order } from '@ecom/types';
import { api, getAccessToken } from '../session';
import type { FormState } from '../form-state';

export async function placeOrderAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) redirect('/login?redirectTo=%2Fcheckout');

  const shippingAddress = {
    fullName: String(formData.get('fullName') ?? '').trim(),
    line1: String(formData.get('line1') ?? '').trim(),
    line2: String(formData.get('line2') ?? '').trim() || undefined,
    city: String(formData.get('city') ?? '').trim(),
    state: String(formData.get('state') ?? '').trim() || undefined,
    postalCode: String(formData.get('postalCode') ?? '').trim(),
    country: String(formData.get('country') ?? '').trim().toUpperCase(),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
  };

  const savedAddressId = String(formData.get('savedAddressId') ?? '').trim();
  const customerNote = String(formData.get('customerNote') ?? '').trim() || undefined;

  // A stable key for this submission. The server also derives one from the basket
  // revision, so a duplicate submit collapses to a single order either way.
  const idempotencyKey = String(formData.get('idempotencyKey') ?? '') || randomUUID();

  let order: Order;
  try {
    order = await api.post<Order>(
      endpoints.storefront.orders,
      savedAddressId
        ? { shippingAddressId: savedAddressId, customerNote }
        : { shippingAddress, customerNote },
      { token, idempotencyKey },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: Object.keys(error.fieldErrors).length > 0 ? error.fieldErrors : undefined,
      };
    }
    return { status: 'error', message: 'Your order could not be placed. Please try again.' };
  }

  revalidatePath('/cart');
  revalidatePath('/account/orders');
  revalidatePath('/', 'layout');
  redirect(`/account/orders/${order.id}?placed=1`);
}
