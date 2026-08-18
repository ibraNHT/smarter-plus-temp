import { Capacitor } from '@capacitor/core';

/** Public website origin used in share links, referrals, and store listings. */
export const PUBLIC_WEB_ORIGIN = (
  import.meta.env.VITE_WEB_ORIGIN || 'https://acheteici.com'
).replace(/\/$/, '');

export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const getPublicWebOrigin = (): string => {
  if (isNativeApp()) return PUBLIC_WEB_ORIGIN;
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/$/, '');
    if (origin && !origin.startsWith('capacitor:') && origin !== 'https://localhost' && origin !== 'http://localhost') {
      return origin;
    }
  }
  return PUBLIC_WEB_ORIGIN;
};

/** Production API used when a native binary was built without VITE_API_BASE_URL. */
const NATIVE_API_FALLBACK = 'https://api.acheteici.com';

export const resolveApiBaseUrl = (): string => {
  const env = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  if (env) return env;
  if (import.meta.env.DEV && !isNativeApp()) return '';
  if (isNativeApp() || import.meta.env.VITE_NATIVE === 'true') return NATIVE_API_FALLBACK;
  return 'http://localhost:3000';
};
