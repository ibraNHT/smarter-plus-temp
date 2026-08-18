import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from './config';
import {
  attemptTokenRefresh,
  forceLogoutRedirect,
  getToken,
} from '../services/apiService';
import { nativeStorageGet } from '../services/nativeStorage';

const TOKEN_KEYS = ['authToken', 'token', 'accessToken'] as const;

const readToken = (): string | null => {
  for (const key of TOKEN_KEYS) {
    const value = nativeStorageGet(key);
    if (value) return value;
  }
  return null;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 401 handling for axios — mirrors `apiFetch` so a stale access token does not
 * leave the user stuck on a screen with broken data.
 *
 * Flow:
 *   1) Request fails with 401 → try a single deduplicated `attemptTokenRefresh`.
 *   2) On success, retry the original request once with the new Bearer token.
 *   3) If the retry also 401s, or refresh fails (e.g. refresh token expired/revoked),
 *      force-logout and bounce the user to /login.
 *
 * The retry is gated by `_isRetry` and skipped entirely for callers that set
 * `_silent401: true` on the axios config (background polls / guest support chat).
 * Must NOT be sent as an HTTP header — browsers block undeclared custom headers via CORS.
 */
export type AgmAxiosConfig = InternalAxiosRequestConfig & {
  _isRetry?: boolean;
  _silent401?: boolean;
};

type RetryableConfig = AgmAxiosConfig;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetryableConfig | undefined;

    // 429 — back off: the apiFetch cooldown is already tripped via its own path,
    // but for axios we just surface the error so the UI can show a retry hint.
    if (!original || status !== 401) {
      return Promise.reject(error);
    }

    // Some endpoints (e.g. /auth/login itself) legitimately return 401 for bad
    // credentials. We must not try to refresh-and-retry those.
    const url = (original.url || '').toString();
    const isAuthEndpoint =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/forgot-password') ||
      url.includes('/api/auth/reset-password');
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Caller opted into silent failure (background pollers, guest AI chat).
    const silent401 = Boolean(original._silent401);

    if (original._isRetry) {
      // We already refreshed successfully and retried; a second 401 means the
      // session is valid but this request is blocked by a business rule (e.g. OTP /
      // precondition required), NOT an auth failure. Surface it — do NOT log out.
      return Promise.reject(error);
    }

    // Honour silent401 — otherwise a guest support call refreshed, got 401, and
    // was redirected to /login from inside the refresh helper.
    const refreshed = await attemptTokenRefresh({ silent: silent401 });
    if (!refreshed) {
      // Refresh failed → the session itself is dead. (attemptTokenRefresh already
      // redirects when the refresh endpoint 401/403s.) Force out unless silent.
      if (!silent401) forceLogoutRedirect();
      return Promise.reject(error);
    }

    // Refresh succeeded — retry the original request once with the new token.
    const retryConfig: RetryableConfig = { ...original, _isRetry: true };
    const newToken = getToken();
    retryConfig.headers = retryConfig.headers ?? ({} as any);
    if (newToken) {
      (retryConfig.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
    }
    // A 401 from this retry re-enters the interceptor and hits the `_isRetry` branch
    // above (which no longer logs out), so let it propagate to the caller.
    return apiClient.request(retryConfig as AxiosRequestConfig);
  },
);
