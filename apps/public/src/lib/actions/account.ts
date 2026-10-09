'use server';

import { revalidatePath } from 'next/cache';
import { ApiError, endpoints } from '@ecom/api-client';
import { api, getAccessToken } from '../session';
import type { FormState } from '../form-state';

export async function updateProfileAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  try {
    await api.patch(
      endpoints.storefront.profile,
      {
        fullName: String(formData.get('fullName') ?? '').trim(),
        phone: String(formData.get('phone') ?? '').trim() || undefined,
        marketingOptIn: formData.get('marketingOptIn') === 'on',
      },
      { token },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return { status: 'error', message: 'Your details could not be saved.' };
  }

  revalidatePath('/account');
  return { status: 'success', message: 'Your details have been updated.' };
}

export async function saveAddressAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const payload = {
    label: String(formData.get('label') ?? 'Home').trim() || 'Home',
    fullName: String(formData.get('fullName') ?? '').trim(),
    line1: String(formData.get('line1') ?? '').trim(),
    line2: String(formData.get('line2') ?? '').trim() || undefined,
    city: String(formData.get('city') ?? '').trim(),
    state: String(formData.get('state') ?? '').trim() || undefined,
    postalCode: String(formData.get('postalCode') ?? '').trim(),
    country: String(formData.get('country') ?? '').trim().toUpperCase(),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
    isDefault: formData.get('isDefault') === 'on',
  };

  const addressId = String(formData.get('addressId') ?? '').trim();

  try {
    if (addressId) {
      await api.put(endpoints.storefront.address(addressId), payload, { token });
    } else {
      await api.post(endpoints.storefront.addresses, payload, { token });
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return { status: 'error', message: 'That address could not be saved.' };
  }

  revalidatePath('/account/addresses');
  revalidatePath('/checkout');
  return { status: 'success', message: 'Address saved.' };
}

export async function deleteAddressAction(addressId: string): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  try {
    await api.delete(endpoints.storefront.address(addressId), { token });
  } catch (error) {
    if (error instanceof ApiError) return { status: 'error', message: error.message };
    return { status: 'error', message: 'That address could not be removed.' };
  }

  revalidatePath('/account/addresses');
  return { status: 'success', message: 'Address removed.' };
}
