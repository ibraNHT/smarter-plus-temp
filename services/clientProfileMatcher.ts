import type { ClientProfile, UserSession } from '../types';

/**
 * `UserSession.id` is the auth user row; `ClientProfile.id` is the profile row.
 *
 * Pulled out of `storeContext.tsx` into its own file so that the store module
 * only exports React-related symbols (provider + hooks). Vite's React plugin
 * disables Fast Refresh for any file that exports a mix of components and
 * plain functions, and that incompatibility ends up loading two copies of the
 * store module during dev, breaking `useStore()` with
 *   "useStore must be used within a StoreProvider".
 */
export function clientProfileMatchesSession(
  c: ClientProfile,
  session: UserSession,
): boolean {
  if (session.clientId && c.id === session.clientId) return true;
  if (c.userId && c.userId === session.id) return true;
  return false;
}
