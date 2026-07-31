import { describe, it, expect } from 'vitest';
import { normalizePermissions } from './types';

describe('normalizePermissions', () => {
  it('returns empty array for undefined', () => {
    expect(normalizePermissions(undefined)).toEqual([]);
  });

  it('returns array as-is when already array', () => {
    const perms = ['perm_viewDashboard', 'perm_viewIncome'];
    expect(normalizePermissions(perms)).toEqual(perms);
  });

  it('parses JSON string to array', () => {
    const json = '["perm_viewDashboard","perm_viewIncome"]';
    expect(normalizePermissions(json)).toEqual(['perm_viewDashboard', 'perm_viewIncome']);
  });

  it('returns empty array for invalid JSON string', () => {
    expect(normalizePermissions('not json')).toEqual([]);
  });

  it('returns empty array for non-array JSON', () => {
    expect(normalizePermissions('{"a":1}')).toEqual([]);
  });
});
