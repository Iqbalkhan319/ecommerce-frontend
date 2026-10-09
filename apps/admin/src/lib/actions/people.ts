'use server';

import { revalidatePath } from 'next/cache';
import { endpoints } from '@ecom/api-client';
import { api, getAccessToken } from '../session';
import { toFormState, type FormState } from '../form-state';

export async function createAdministratorAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const roleCodes = formData.getAll('roleCodes').map(String).filter(Boolean);
  if (roleCodes.length === 0) {
    return { status: 'error', fieldErrors: { roleCodes: 'Choose at least one role' } };
  }

  try {
    await api.post(
      endpoints.admin.admins,
      {
        email: String(formData.get('email') ?? '').trim(),
        password: String(formData.get('password') ?? ''),
        fullName: String(formData.get('fullName') ?? '').trim(),
        phone: String(formData.get('phone') ?? '').trim() || undefined,
        roleCodes,
      },
      { token },
    );
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/administrators');
  return { status: 'success', message: 'Administrator created.' };
}

export async function updateAdministratorRolesAction(userId: string, roleCodes: string[]): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  try {
    await api.post(endpoints.admin.adminRoles(userId), { roleCodes }, { token });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/administrators');
  return { status: 'success', message: 'Roles updated. The change takes effect immediately.' };
}

export async function setAccountStatusAction(
  scope: 'admins' | 'customers',
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED',
): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const path = scope === 'admins' ? endpoints.admin.administrator(userId) : endpoints.admin.customer(userId);

  try {
    await api.patch(path, { status }, { token });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/${scope === 'admins' ? 'administrators' : 'customers'}`);
  return { status: 'success', message: status === 'ACTIVE' ? 'Account reinstated.' : 'Account suspended.' };
}

export async function deactivateAccountAction(scope: 'admins' | 'customers', userId: string): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const path = scope === 'admins' ? endpoints.admin.administrator(userId) : endpoints.admin.customer(userId);

  try {
    await api.delete(path, { token });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/${scope === 'admins' ? 'administrators' : 'customers'}`);
  return { status: 'success', message: 'Account deactivated and its sessions revoked.' };
}

export async function saveRoleAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  const id = String(formData.get('id') ?? '').trim();
  const permissions = formData.getAll('permissions').map(String).filter(Boolean);

  const payload = {
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || undefined,
    permissions,
  };

  try {
    if (id) await api.patch(endpoints.admin.role(id), payload, { token });
    else await api.post(endpoints.admin.roles, { ...payload, code: String(formData.get('code') ?? '').trim().toUpperCase() }, { token });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/roles');
  return { status: 'success', message: id ? 'Role updated.' : 'Role created.' };
}

export async function deleteRoleAction(roleId: string): Promise<FormState> {
  const token = await getAccessToken();
  if (!token) return { status: 'error', message: 'Please sign in again.' };

  try {
    await api.delete(endpoints.admin.role(roleId), { token });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath('/roles');
  return { status: 'success', message: 'Role deleted.' };
}
