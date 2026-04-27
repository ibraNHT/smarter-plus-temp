import { AxiosRequestConfig } from 'axios';
import { apiClient } from './client';
import { ApiRequestOptions } from './types';

const buildConfig = (options?: ApiRequestOptions): AxiosRequestConfig => ({
  headers: {
    ...(options?.headers ?? {}),
    ...(options?.silent401 ? { 'x-silent-401': true } : {}),
  },
});

export async function apiGet<T>(url: string, options?: ApiRequestOptions): Promise<T> {
  const { data } = await apiClient.get<T>(url, buildConfig(options));
  return data;
}

export async function apiPost<T>(url: string, payload?: unknown, options?: ApiRequestOptions): Promise<T> {
  const { data } = await apiClient.post<T>(url, payload ?? {}, buildConfig(options));
  return data;
}

export async function apiPatch<T>(url: string, payload?: unknown, options?: ApiRequestOptions): Promise<T> {
  const { data } = await apiClient.patch<T>(url, payload ?? {}, buildConfig(options));
  return data;
}

export async function apiPut<T>(url: string, payload?: unknown, options?: ApiRequestOptions): Promise<T> {
  const { data } = await apiClient.put<T>(url, payload ?? {}, buildConfig(options));
  return data;
}

export async function apiDelete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
  const { data } = await apiClient.delete<T>(url, buildConfig(options));
  return data;
}
