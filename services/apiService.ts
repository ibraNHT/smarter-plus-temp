
/**
 * Central API service for AgriMarket Connect.
 * Reads the backend URL from Vite env and automatically
 * attaches the JWT Authorization header when a token is present.
 */

// In dev, use same origin so Vite proxy forwards /api to the backend (avoids CORS).
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3000');
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getToken = (): string | null =>
    localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token') || localStorage.getItem('accessToken');

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token);

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

/** Attempt to silently refresh the access token (HttpOnly cookie and/or body refresh token). */
const attemptTokenRefresh = async (): Promise<boolean> => {
    if (refreshInFlight) return refreshInFlight;
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
            if (!response.ok) return false;
            const data = await response.json();
            if (data.accessToken) {
                setToken(data.accessToken);
                if (data.refreshToken) setRefreshToken(data.refreshToken);
                return true;
            }
        } catch {
            // network error during refresh — fail silently
        }
        return false;
    })();

    try {
        return await refreshInFlight;
    } finally {
        refreshInFlight = null;
    }
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
        if (response.status === 401) {
            // Attempt one token refresh (cookie + optional body token), then retry once.
            if (!_isRetry) {
                const refreshed = await attemptTokenRefresh();
                if (refreshed) {
                    return apiFetch<T>(path, { ...options, _isRetry: true });
                }
            }
            // Only hard-reset session for interactive calls. Background `silent401` requests
            // must not wipe tokens (e.g. cross-origin cookie not sent previously → spurious 401).
            if (!silent401) {
                clearToken();
                localStorage.removeItem('currentUser');
                // HashRouter app: route via hash to avoid landing on a blank/non-hash URL.
                window.location.assign('/#/login');
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
 */
export const apiUpload = async <T = unknown>(
    path: string,
    formData: FormData
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

    if (!response.ok) {
        let message = `Upload error ${response.status}`;
        try {
            const body = await response.json();
            message = body?.message || message;
        } catch {
            // ignore
        }
        throw new Error(message);
    }

    return response.json() as Promise<T>;
};