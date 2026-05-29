import type { UserSession } from '../types';

import { normalizeRole } from './authRoles';

/**
 * Producer dashboard access (routes, orders, offers, wallet for the farm account).
 * - PRODUCER: requires `producerId` (unchanged from validated flow).
 * - MANAGER: requires assignment via `managedProducerUserId` and/or synced `producerId`.
 */
export function isProducerDashboardUser(
  user:
    | {
        role?: unknown;
        producerId?: string | null;
        managedProducerUserId?: string | null;
      }
    | null
    | undefined,
): boolean {
  if (!user) return false;
  const r = normalizeRole(user.role);
  if (r === 'PRODUCER') return Boolean(user.producerId);
  if (r === 'MANAGER') {
    return Boolean(user.producerId || user.managedProducerUserId);
  }
  return false;
}

export function isManagerSession(
  user: { role?: unknown } | null | undefined,
): boolean {
  return normalizeRole(user?.role) === 'MANAGER';
}

export function isProducerOwnerSession(
  user: { role?: unknown } | null | undefined,
): boolean {
  return normalizeRole(user?.role) === 'PRODUCER';
}

/**
 * Auth user id used for wallet/orders API scoping.
 * PRODUCER → own `user.id` (same as before manager work).
 * MANAGER → assigned producer's user id.
 */
export function producerAccountUserId(
  user: Pick<UserSession, 'id' | 'role' | 'managedProducerUserId'> | null | undefined,
): string {
  if (!user) return '';
  if (isManagerSession(user) && user.managedProducerUserId) {
    return user.managedProducerUserId;
  }
  return user.id;
}

export function producerDashboardHome(user: UserSession | null | undefined): string {
  return isProducerDashboardUser(user) ? '/producer/dashboard' : '/market/producers';
}
