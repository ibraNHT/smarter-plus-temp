/**
 * WebApp allows only marketplace roles. JWT `role` claim is the source of truth when a token exists.
 */

const WEBAPP_ROLES = new Set(['CLIENT', 'PRODUCER']);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function normalizeRole(role: unknown): string {
  const normalized = String(role ?? '').trim().toUpperCase();
  // Defensive aliases for older/misspelled role payloads.
  if (normalized === 'RETAILER' || normalized === 'RETAIL') return 'RETAIL_ADMIN';
  return normalized;
}

export function getRoleFromToken(token: string): string {
  const payload = decodeJwtPayload(token);
  return normalizeRole(payload?.role);
}

export function isWebAppAllowedRole(role: unknown): boolean {
  return WEBAPP_ROLES.has(normalizeRole(role));
}

/**
 * True when an access token or persisted user indicates a signed-in session that is not allowed in WebApp.
 */
export function isWebAppSessionBlocked(
  token: string | null,
  storeUser: { role?: unknown } | null | undefined,
): boolean {
  const authed = !!(token || storeUser);
  if (!authed) return false;

  let role = '';
  if (token) {
    role = getRoleFromToken(token);
    if (!role && storeUser?.role != null) {
      role = normalizeRole(storeUser.role);
    }
  } else if (storeUser?.role != null) {
    role = normalizeRole(storeUser.role);
  }

  if (!role) return false;
  return !isWebAppAllowedRole(role);
}
