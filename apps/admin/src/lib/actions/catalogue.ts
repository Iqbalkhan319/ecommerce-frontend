'use server';

import { revalidatePath } from 'next/cache';
import { endpoints } from '@ecom/api-client';
import { api, getAccessToken } from '../session';
import { toFormState, type FormState } from '../form-state';

function requiredString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function optionalNumber(formData: FormData, key: string): number | undefined {
  const raw = String(formData.get(key) ?? '').trim();
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export async function saveProductAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const id = requiredString(formData, 'id');
  const imageUrl = requiredString(formData, 'imageUrl');

  const payload: Record<string, unknown> = {
    name: requiredString(formData, 'name'),
    slug: requiredString(formData, 'slug'),
    description: requiredString(formData, 'description') || undefined,
    shortDescription: requiredString(formData, 'shortDescription') || undefined,
    categoryId: requiredString(formData, 'categoryId'),
    price: optionalNumber(formData, 'price'),
    compareAtPrice: optionalNumber(formData, 'compareAtPrice'),
    lowStockThreshold: optionalNumber(formData, 'lowStockThreshold'),
    status: requiredString(formData, 'status') || 'DRAFT',
    weightGrams: optionalNumber(formData, 'weightGrams'),
    ...(imageUrl ? { images: [{ url: imageUrl, altText: requiredString(formData, 'name'), isPrimary: true }] } : {}),
  };

  try {
    if (id) {
      await api.patch(endpoints.admin.product(id), payload, { token });
    } else {
      // Stock is only set at creation; afterwards it moves through the audited adjustment
      // endpoint so every change has a reason and an actor.
      await api.post(
        endpoints.admin.products,
        { ...payload, sku: requiredString(formData, 'sku'), stockQuantity: optionalNumber(formData, 'stockQuantity') ?? 0 },
        { token },
      );
    }
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/products');
  return { status: 'success', message: id ? 'Product updated.' : 'Product created.' };
}

export async function adjustStockAction(productId: string, delta: number, reason: string): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  try {
    await api.post(endpoints.admin.productStock(productId), { delta, reason }, { token });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/products');
  return { status: 'success', message: 'Stock adjusted.' };
}

export async function archiveProductAction(productId: string): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  try {
    await api.delete(endpoints.admin.product(productId), { token });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/products');
  return { status: 'success', message: 'Product archived.' };
}

export async function saveCategoryAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const id = requiredString(formData, 'id');
  const payload = {
    name: requiredString(formData, 'name'),
    slug: requiredString(formData, 'slug'),
    description: requiredString(formData, 'description') || undefined,
    position: optionalNumber(formData, 'position') ?? 0,
    isActive: formData.get('isActive') === 'on',
    imageUrl: requiredString(formData, 'imageUrl') || undefined,
  };

  try {
    if (id) await api.patch(endpoints.admin.category(id), payload, { token });
    else await api.post(endpoints.admin.categories, payload, { token });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/categories');
  return { status: 'success', message: id ? 'Category updated.' : 'Category created.' };
}

export async function deleteCategoryAction(categoryId: string): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  try {
    await api.delete(endpoints.admin.category(categoryId), { token });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/categories');
  return { status: 'success', message: 'Category deleted.' };
}
