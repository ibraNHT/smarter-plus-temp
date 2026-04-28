import axios from 'axios';
import { getApiBaseUrl } from './config';

const TOKEN_KEYS = ['authToken', 'token', 'accessToken'] as const;

const getToken = (): string | null => {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

