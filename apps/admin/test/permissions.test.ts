import { describe, expect, it } from 'vitest';
import { NAVIGATION, can, canAny } from '../src/lib/permissions';

const staff = { permissions: ['product:read', 'order:read', 'category:read'], isSuperAdmin: false };
const manager = {
  permissions: ['product:read', 'product:update', 'order:read', 'order:confirm', 'order:reject'],
  isSuperAdmin: false,
};
const owner = { permissions: [], isSuperAdmin: true };

describe('permission checks', () => {
  it('grants only what the role carries', () => {
    expect(can(staff, 'product:read')).toBe(true);
    expect(can(staff, 'product:update')).toBe(false);
    expect(can(manager, 'order:confirm')).toBe(true);
    expect(can(manager, 'admin:delete')).toBe(false);
  });

  it('treats the super administrator as holding everything', () => {
    expect(can(owner, 'admin:delete')).toBe(true);
    expect(can(owner, 'role:create')).toBe(true);
  });

  it('denies everything when there is no user', () => {
    expect(can(null, 'product:read')).toBe(false);
    expect(canAny(null, ['product:read', 'order:read'])).toBe(false);
  });

  it('supports an any-of check for sections with several entry points', () => {
    expect(canAny(staff, ['admin:read', 'order:read'])).toBe(true);
    expect(canAny(staff, ['admin:read', 'role:read'])).toBe(false);
  });

  it('hides navigation entries the role cannot open', () => {
    const visible = NAVIGATION.filter((item) => !item.permission || can(staff, item.permission)).map((item) => item.href);
    expect(visible).toContain('/orders');
    expect(visible).toContain('/products');
    expect(visible).not.toContain('/administrators');
    expect(visible).not.toContain('/roles');
    expect(visible).not.toContain('/audit');
  });

  it('shows every navigation entry to the owner', () => {
    const visible = NAVIGATION.filter((item) => !item.permission || can(owner, item.permission));
    expect(visible).toHaveLength(NAVIGATION.length);
  });
});
