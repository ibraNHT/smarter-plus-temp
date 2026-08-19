import { describe, it, expect } from 'vitest';
import { normalizePermissions } from './types';
import { convertAmount, FALLBACK_USD_RATES } from './lib/exchangeRates';

describe('convertAmount', () => {
  it('converts using USD-base rates without mutating the stored amount', () => {
    expect(convertAmount(50, 'CAD', 'CAD', FALLBACK_USD_RATES)).toBe(50);
    expect(convertAmount(50, 'CAD', 'XAF', FALLBACK_USD_RATES)).toBeCloseTo(50 * FALLBACK_USD_RATES.XAF / FALLBACK_USD_RATES.CAD, 5);
  });
});

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
