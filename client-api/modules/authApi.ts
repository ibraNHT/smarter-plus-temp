import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { UserSession } from '../../types';

export type AuthSessionPayload = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: UserSession;
};

export const authApi = {
  async login(identifier: string, password: string): Promise<AuthSessionPayload> {
    const { data } = await apiClient.post<AuthSessionPayload>(API_ENDPOINTS.auth.login, {
      identifier,
      password,
    });
    return data;
  },
  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.logout, {});
  },
};
