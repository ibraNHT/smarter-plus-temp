import { API_ENDPOINTS } from '../endpoints';
import { apiPost } from '../http';
import { UserSession } from '../../types';

export type AuthSessionPayload = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: UserSession;
};

export const loginRequest = (identifier: string, password: string) =>
  apiPost<AuthSessionPayload>(API_ENDPOINTS.auth.login, { identifier, password });

export const logoutRequest = () => apiPost<void>(API_ENDPOINTS.auth.logout, {});
