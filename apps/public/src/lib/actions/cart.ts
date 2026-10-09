'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError, endpoints } from '@ecom/api-client';
import type { Cart } from '@ecom/types';
import { api, getAccessToken } from '../session';
import type { CartActionState } from './cart-state';


async function withToken<T>(operation: (token: string) => Promise<T>): Promise<T | CartActionState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in to use your basket.' };
  try {
    return await operation(token);
  } catch (error) {
    if (error instanceof ApiError) return { status: 'error', message: error.message };
    return { status: 'error', message: 'Your basket could not be updated. Please try again.' };
  }
}

export async function addToCartAction(_previous: CartActionState, formData: FormData): Promise<CartActionState> {
  const productId = String(formData.get('productId') ?? '');
  const quantity = Number(formData.get('quantity') ?? 1);
  const token = await getAccessToken();

  if (!token) {
    const slug = String(formData.get('slug') ?? '');
    const target = encodeURIComponent(slug ? `/products/${slug}` : '/products');
    redirect(`/login?redirectTo=${target}&reason=basket`);
  }

  try {
    await api.post<Cart>(endpoints.storefront.cartItems, { productId, quantity }, { token });
  } catch (error) {
    if (error instanceof ApiError) return { status: 'error', message: error.message };
    return { status: 'error', message: 'That item could not be added to your basket.' };
  }

  revalidatePath('/cart');
  revalidatePath('/', 'layout');
  return { status: 'success', message: 'Added to your basket.' };
}

export async function updateCartItemAction(productId: string, quantity: number): Promise<CartActionState> {
  const result = await withToken(async (token) => {
    await api.patch<Cart>(endpoints.storefront.cartItem(productId), { quantity }, { token });
    return { status: 'success' as const };
  });
  revalidatePath('/cart');
  revalidatePath('/', 'layout');
  return result as CartActionState;
}

export async function removeCartItemAction(productId: string): Promise<CartActionState> {
  const result = await withToken(async (token) => {
    await api.delete<Cart>(endpoints.storefront.cartItem(productId), { token });
    return { status: 'success' as const };
  });
  revalidatePath('/cart');
  revalidatePath('/', 'layout');
  return result as CartActionState;
}

export async function clearCartAction(): Promise<CartActionState> {
  const result = await withToken(async (token) => {
    await api.delete<Cart>(endpoints.storefront.cart, { token });
    return { status: 'success' as const };
  });
  revalidatePath('/cart');
  revalidatePath('/', 'layout');
  return result as CartActionState;
}
