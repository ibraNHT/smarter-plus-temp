/**
 * Typed environment configuration.
 * Only VITE_* variables are exposed to the client.
 */

const raw = typeof import.meta !== 'undefined' && import.meta.env
  ? (import.meta.env as Record<string, string | undefined>)
  : ({} as Record<string, string | undefined>);

/** Production API base (no port). Used when baked-in URL wrongly includes :3000/:5002. */
const PRODUCTION_API_BASE = 'https://api.smarterworkspace.cloud';

/**
 * In production (smarterworkspace.cloud), if the baked-in URL contains a port (:3000, :5002),
 * use the known public API base so uploads and API calls don't fail (ERR_SSL_PROTOCOL_ERROR).
 */
function normalizeApiUrl(url: string, pathSuffix: string): string {
  if (typeof window === 'undefined') return url;
  const isProductionHost = /smarterworkspace\.cloud$/i.test(window.location.hostname);
  const hasWrongPort = /:\d+(\/|$)/.test(url) && (url.includes(':3000') || url.includes(':5002'));
  if (isProductionHost && hasWrongPort) {
    return `${PRODUCTION_API_BASE}${pathSuffix}`;
  }
  return url;
}

const bakedApi = raw.VITE_API_URL ?? (typeof window !== 'undefined' ? `${window.location.origin}/api` : '');
const bakedUpload = raw.VITE_UPLOAD_API_URL ?? raw.VITE_API_URL?.replace(/\/api\/?$/, '') ?? (typeof window !== 'undefined' ? window.location.origin : '');

export const env = {
  VITE_API_URL: normalizeApiUrl(bakedApi, '/api'),
  VITE_UPLOAD_API_URL: normalizeApiUrl(bakedUpload, ''),
  VITE_USE_MOCKS: raw.VITE_USE_MOCKS === 'true',
  /** When true, auth uses httpOnly cookies: credentials: 'include', no token in localStorage. Backend must support cookie-based session. */
  VITE_USE_HTTPONLY_COOKIES: raw.VITE_USE_HTTPONLY_COOKIES === 'true',
} as const;

export const API_URL = env.VITE_API_URL;
export const UPLOAD_API_URL = env.VITE_UPLOAD_API_URL;
export const USE_MOCKS = env.VITE_USE_MOCKS;
export const USE_HTTPONLY_COOKIES = env.VITE_USE_HTTPONLY_COOKIES;
