/**
 * Support session REST API — aligned with Nest `SupportController` (/api/support/*).
 */

import type { SupportMessage } from '../types';
import { apiFetch, getToken } from './apiService';
import { apiGet, apiPost } from '../client-api/http';
import { API_ENDPOINTS } from '../client-api/endpoints';

export type SupportMessageDto = {
  id: string;
  sender: 'USER' | 'AI' | 'AGENT';
  text: string;
  timestamp: string;
  internal?: boolean;
};

export type CreateSupportSessionResponse = {
  sessionId: string;
  userId: string;
  userName?: string;
  status: string;
  lastActive: string;
};

export type PostSupportMessageResponse = {
  sessionId: string;
  message: SupportMessageDto | null;
};

export type UserSupportSessionSummary = {
  sessionId: string;
  userId: string;
  userName?: string;
  status: string;
  lastMessage?: string;
  lastActive: string;
};

/** List open support sessions for the logged-in platform user. */
export async function listUserSupportSessions(): Promise<UserSupportSessionSummary[]> {
  const token = getToken();
  if (!token) return [];
  try {
    return await apiGet<UserSupportSessionSummary[]>(API_ENDPOINTS.support.sessions, {
      silent401: true,
    });
  } catch {
    return [];
  }
}

export async function createOrGetSupportSession(): Promise<CreateSupportSessionResponse> {
  return apiFetch<CreateSupportSessionResponse>(API_ENDPOINTS.support.sessions, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Authenticated poll — uses fetch so a 401 during background polling does not run apiFetch global logout.
 */
export async function getSupportMessages(sessionId: string): Promise<SupportMessageDto[]> {
  const token = getToken();
  if (!token) return [];
  try {
    return await apiGet<SupportMessageDto[]>(API_ENDPOINTS.support.sessionMessages(sessionId), { silent401: true });
  } catch (e: any) {
    console.warn(`Support messages poll failed: ${e?.message || 'unknown'}`);
    return [];
  }
}

export async function postUserSupportMessage(
  sessionId: string,
  text: string
): Promise<PostSupportMessageResponse> {
  return apiFetch<PostSupportMessageResponse>(API_ENDPOINTS.support.sessionMessages(sessionId), {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/** Guest — no JWT; guestEmail must match session. */
export async function postGuestSupportMessage(
  sessionId: string,
  text: string,
  guestEmail: string
): Promise<PostSupportMessageResponse> {
  return apiPost<PostSupportMessageResponse>(
    API_ENDPOINTS.support.guestSessionMessagesPost(sessionId),
    { text, guestEmail },
    { silent401: true },
  );
}

export async function getGuestSupportMessages(sessionId: string, guestEmail: string): Promise<SupportMessageDto[]> {
  try {
    return await apiGet<SupportMessageDto[]>(
      API_ENDPOINTS.support.guestSessionMessages(sessionId, guestEmail),
      { silent401: true },
    );
  } catch {
    return [];
  }
}

/** Map API DTO to app SupportMessage. */
export function mapDtoToSupportMessage(dto: SupportMessageDto): SupportMessage {
  return {
    id: dto.id,
    sender: dto.sender,
    text: dto.text,
    timestamp:
      typeof dto.timestamp === 'string' ? dto.timestamp : new Date(dto.timestamp as any).toISOString(),
    ...(dto.internal ? { internal: dto.internal } : {}),
  };
}

/** Merge server messages into previous list by id (append only new). */
export function mergeIncomingSupportMessages<T extends { id: string }>(
  prev: T[],
  incoming: T[]
): T[] {
  const existingIds = new Set(prev.map((m) => m.id));
  const newOnes = incoming.filter((m) => !existingIds.has(m.id));
  if (newOnes.length === 0) return prev;
  return [...prev, ...newOnes];
}
