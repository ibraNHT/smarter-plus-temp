import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from './config';
import {
  attemptTokenRefresh,
  forceLogoutRedirect,
  getToken,
} from '../services/apiService';

const TOKEN_KEYS = ['authToken', 'token', 'accessToken'] as const;

const readToken = (): string | null => {
  for (const key of TOKEN_KEYS) {
    const value = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
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
 * The retry is gated by `_isRetry` and skipped entirely for callers that pass
 * `x-silent-401: true` (background polls that should fail quietly).
 */
type RetryableConfig = InternalAxiosRequestConfig & {
  _isRetry?: boolean;
};

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

    // Caller opted into silent failure (background pollers).
    const headers = (original.headers ?? {}) as Record<string, unknown>;
    const silent401 =
      headers['x-silent-401'] === true ||
      headers['x-silent-401'] === 'true' ||
      headers['X-Silent-401'] === true ||
      headers['X-Silent-401'] === 'true';

    if (original._isRetry) {
      // Already retried once — give up and (unless silent) log out.
      if (!silent401) forceLogoutRedirect();
      return Promise.reject(error);
    }

    const refreshed = await attemptTokenRefresh();
    if (!refreshed) {
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
    try {
      return await apiClient.request(retryConfig as AxiosRequestConfig);
    } catch (retryErr) {
      const retryStatus = (retryErr as AxiosError)?.response?.status;
      if (retryStatus === 401 && !silent401) {
        forceLogoutRedirect();
      }
      return Promise.reject(retryErr);
    }
  },
);
