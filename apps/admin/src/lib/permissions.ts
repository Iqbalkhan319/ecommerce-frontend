import type { AuthenticatedUser, PermissionCode } from '@ecom/types';

/**
 * Permission checks for the interface only.
 *
 * Hiding a control is a courtesy, not a security boundary: the admin service re-checks
 * every permission on every request, so a hidden button that is somehow clicked still
 * fails server side.
 */
export function can(user: Pick<AuthenticatedUser, 'permissions' | 'isSuperAdmin'> | null, permission: PermissionCode): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.permissions.includes(permission);
}

export function canAny(user: Pick<AuthenticatedUser, 'permissions' | 'isSuperAdmin'> | null, permissions: PermissionCode[]): boolean {
  return permissions.some((permission) => can(user, permission));
}

export const NAVIGATION: Array<{ href: string; label: string; permission?: PermissionCode }> = [
  { href: '/', label: 'Dashboard', permission: 'dashboard:read' },
  { href: '/orders', label: 'Orders', permission: 'order:read' },
  { href: '/products', label: 'Products', permission: 'product:read' },
  { href: '/categories', label: 'Categories', permission: 'category:read' },
  { href: '/inventory', label: 'Inventory', permission: 'inventory:read' },
  { href: '/reports', label: 'Reports', permission: 'report:read' },
  { href: '/customers', label: 'Customers', permission: 'customer:read' },
  { href: '/administrators', label: 'Administrators', permission: 'admin:read' },
  { href: '/roles', label: 'Roles', permission: 'role:read' },
  { href: '/audit', label: 'Audit trail', permission: 'audit:read' },
];
