import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from './endpoints';
import { clearToken, getRefreshToken, getToken, setRefreshToken, setToken } from '../services/apiService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3000');

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<boolean> | null = null;

const refreshAccessToken = async (): Promise<boolean> => {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const refreshToken = getRefreshToken();
      const response = await axios.post(
        `${BASE_URL}${API_ENDPOINTS.auth.refresh}`,
        refreshToken ? { refreshToken } : {},
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (response?.data?.accessToken) {
        setToken(response.data.accessToken);
        if (response.data.refreshToken) setRefreshToken(response.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const status = error.response?.status;
    const config = (error.config || {}) as RetryableConfig;
    const silent401 = (config.headers as Record<string, unknown> | undefined)?.['x-silent-401'] === true;

    if (status === 401 && !config._retry) {
      config._retry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiClient(config);
      }
      if (!silent401) {
        clearToken();
        localStorage.removeItem('currentUser');
        window.location.assign('/#/login');
      }
    }

    const rawMessage = error.response?.data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage || error.message || `API error ${status ?? ''}`.trim();

    return Promise.reject(new Error(message));
  },
);
