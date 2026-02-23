
/**
 * Central API service for AgriMarket Connect.
 * Reads the backend URL from Vite env and automatically
 * attaches the JWT Authorization header when a token is present.
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
const TOKEN_KEY = 'authToken';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

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
}

/**
 * Typed fetch wrapper. Throws on non-OK responses with the server error message.
 */
export const apiFetch = async <T = unknown>(
    path: string,
    options: ApiFetchOptions = {}
): Promise<T> => {
    const { headers: extraHeaders, ...rest } = options;
    const response = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        credentials: 'include',
        headers: buildHeaders(extraHeaders),
    });

    if (!response.ok) {
        let message = `API error ${response.status}`;
        try {
            const body = await response.json();
            message = body?.message || message;
        } catch {
            // body was not JSON, keep default message
        }
        throw new Error(message);
    }

    // 204 No Content has no body
    if (response.status === 204) return undefined as T;

    return response.json() as Promise<T>;
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
