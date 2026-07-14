
/**
 * Central API service for AgriMarket Connect.
 * Reads the backend URL from Vite env and automatically
 * attaches the JWT Authorization header when a token is present.
 */

// In dev, use same origin so Vite proxy forwards /api to the backend (avoids CORS).
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3000');
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Read ONLY the canonical key. We used to fall back to legacy 'token'/'accessToken',
// but nothing writes those anymore, so any value there is a stale/expired leftover.
// Reading it after logout caused a spurious 401 → forceLogoutRedirect on the next
// login (looked like a reload; needed a second login). clearToken() also purges them.
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Purge legacy token keys too. They are never written anymore, so if present
    // they are stale/expired leftovers; leaving them behind made logout incomplete
    // and produced a 401 → forced re-login on the next attempt.
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    // Also drop cached session user — anything reading `currentUser` will see
    // the logged-out state immediately on next render.
    try { localStorage.removeItem('currentUser'); } catch { /* noop */ }
};

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token);

/**
 * Hard log-out used when the refresh token itself fails (the session is dead).
 * Centralised so axios + fetch wrappers + WebSocket clients all behave the same way:
 * drop client state and bounce to /login. We use replace() to wipe the back-history
 * entry that triggered the 401 — pressing back must not silently re-issue the
 * unauthorised request.
 */
export const forceLogoutRedirect = (): void => {
    clearToken();
    if (typeof window === 'undefined') return;
    // Tell other tabs to clear their in-memory session immediately.
    try { window.dispatchEvent(new Event('agm:session-expired')); } catch { /* noop */ }
    const hash = window.location.hash || '';
    if (hash === '#/login' || hash.startsWith('#/login?')) return;
    // Preserve the page user was trying to reach so we can redirect post-login if desired.
    try {
        const intended = `${window.location.pathname}${window.location.hash}`;
        if (intended && !intended.startsWith('/login')) {
            sessionStorage.setItem('postLoginRedirect', intended);
        }
    } catch { /* noop */ }
    window.location.hash = '#/login';
};

const buildHeaders = (extra?: Record<string, string>): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...extra,
    };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

interface ApiFetchOptions extends Omit<RequestInit, 'headers'> {
    headers?: Record<string, string>;
    /** If true, a 401 response will NOT trigger a logout+redirect. Use for background/polling calls. */
    silent401?: boolean;
    /** Internal flag — set to true after one refresh attempt to prevent infinite loops */
    _isRetry?: boolean;
    /** Internal — after a 304, retry GET once without conditional cache headers */
    _after304Retry?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;
let lastRefreshFailed = 0;
const REFRESH_COOLDOWN_MS = 10_000;

/** True when a recent refresh failed and the cooldown hasn't elapsed. */
export const isRefreshOnCooldown = (): boolean =>
    Date.now() - lastRefreshFailed < REFRESH_COOLDOWN_MS;

/** Attempt to silently refresh the access token. Deduplicates concurrent calls and
 *  enforces a cooldown after failure to prevent 429 storms.
 *  When the refresh endpoint itself returns 401 the session is truly dead —
 *  clear tokens and redirect to login immediately.
 *
 *  Exported so the axios interceptor in `client-api/client.ts` shares the same
 *  in-flight promise and cooldown state as the fetch-based `apiFetch` below.
 *  Otherwise both pipelines would attempt refresh independently and could
 *  burn the rotated refresh token before either retry runs. */
export const attemptTokenRefresh = async (): Promise<boolean> => {
    if (refreshInFlight) return refreshInFlight;
    if (Date.now() - lastRefreshFailed < REFRESH_COOLDOWN_MS) return false;

    refreshInFlight = (async () => {
        const bodyRefresh = getRefreshToken();
        try {
            const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    bodyRefresh ? { refreshToken: bodyRefresh } : {},
                ),
            });
            if (!response.ok) {
                lastRefreshFailed = Date.now();
                // 401/403 from /auth/refresh means the refresh token is dead —
                // sign the user out and route to login. For other 5xx errors
                // we don't force-logout: the request may succeed later.
                if (response.status === 401 || response.status === 403) {
                    forceLogoutRedirect();
                }
                return false;
            }
            const data = await response.json();
            if (data.accessToken) {
                setToken(data.accessToken);
                if (data.refreshToken) setRefreshToken(data.refreshToken);
                lastRefreshFailed = 0;
                try { window.dispatchEvent(new Event('agm:token-refreshed')); } catch { /* noop */ }
                return true;
            }
        } catch {
            // Network failure — flag cooldown but don't force-logout. The user
            // may be offline; we'll retry the refresh when they come back.
            lastRefreshFailed = Date.now();
        }
        return false;
    })();

    const result = await refreshInFlight;
    setTimeout(() => { refreshInFlight = null; }, 2000);
    return result;
};

/**
 * Typed fetch wrapper. Throws on non-OK responses with the server error message.
 * Automatically retries once after silently refreshing an expired token.
 */
export const apiFetch = async <T = unknown>(
    path: string,
    options: ApiFetchOptions = {}
): Promise<T> => {
    const { headers: extraHeaders, silent401, _isRetry, _after304Retry, ...rest } = options;
    const response = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        credentials: 'include',
        headers: buildHeaders(extraHeaders),
    });

    // 304 Not Modified has no body — browsers may send If-None-Match from a prior response.
    // Backend disables ETag for JSON; if a proxy still returns 304, retry once with no-store headers.
    if (
        response.status === 304 &&
        !_after304Retry &&
        (!rest.method || rest.method === 'GET')
    ) {
        return apiFetch<T>(path, {
            ...options,
            _after304Retry: true,
            cache: 'no-store',
            headers: {
                ...extraHeaders,
                'Cache-Control': 'no-store',
                Pragma: 'no-cache',
            },
        });
    }

    if (!response.ok) {
        // 429 Too Many Requests — trigger the cooldown so all pending/future
        // requests back off instead of continuing to hammer the server.
        if (response.status === 429) {
            lastRefreshFailed = Date.now();
            const err = new Error('Too many requests — please wait a moment.') as Error & { status?: number };
            err.status = 429;
            throw err;
        }

        if (response.status === 401) {
            if (!_isRetry) {
                const refreshed = await attemptTokenRefresh();
                if (refreshed) {
                    return apiFetch<T>(path, { ...options, _isRetry: true });
                }
            }
            // Refresh either failed or is on cooldown — the session is no longer
            // valid. Unless the caller opted in to silent-401 (background polls),
            // force the user out so they can't keep interacting with a broken UI.
            if (!silent401) {
                forceLogoutRedirect();
            }
        }

        let message = `API error ${response.status}`;
        try {
            const body = await response.json();
            message = body?.message || (Array.isArray(body?.message) ? body.message.join(', ') : message);
        } catch {
            // body was not JSON, keep default message
        }
        const err = new Error(message) as Error & { status?: number };
        err.status = response.status;
        throw err;
    }

    // 204 No Content has no body
    if (response.status === 204) return undefined as T;

    const raw = await response.text();
    if (!raw.trim()) return undefined as T;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return undefined as T;
    }
};


/**
 * Multipart upload — no JSON Content-Type header so browser sets the boundary.
 * Retries once after a transparent token refresh on 401, mirroring apiFetch.
 */
export const apiUpload = async <T = unknown>(
    path: string,
    formData: FormData,
    options: { _isRetry?: boolean } = {},
): Promise<T> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
    });

    if (response.status === 401 && !options._isRetry) {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) {
            return apiUpload<T>(path, formData, { _isRetry: true });
        }
        forceLogoutRedirect();
    }

    if (!response.ok) {
        let message = `Upload error ${response.status}`;
        try {
            const body = await response.json();
            message = body?.message || message;
        } catch {
            // ignore
        }
        const err = new Error(message) as Error & { status?: number };
        err.status = response.status;
        throw err;
    }

    return response.json() as Promise<T>;
};