/**
 * Support session REST API — aligned with Nest `SupportController` (/api/support/*).
 */

import type { SupportMessage } from '../types';
import { apiFetch, getToken } from './apiService';

const BASE = '/api/support';

const resolveBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3000');

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

export async function createOrGetSupportSession(): Promise<CreateSupportSessionResponse> {
  return apiFetch<CreateSupportSessionResponse>(`${BASE}/sessions`, {
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
  const baseURL = resolveBaseUrl();
  const response = await fetch(`${baseURL}${BASE}/sessions/${sessionId}/messages`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 401) return [];
  if (!response.ok) {
    console.warn(`Support messages poll failed: ${response.status}`);
    return [];
  }
  return response.json() as Promise<SupportMessageDto[]>;
}

export async function postUserSupportMessage(
  sessionId: string,
  text: string
): Promise<PostSupportMessageResponse> {
  return apiFetch<PostSupportMessageResponse>(`${BASE}/sessions/${sessionId}/messages`, {
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
  const baseURL = resolveBaseUrl();
  const response = await fetch(`${baseURL}${BASE}/guest/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, guestEmail }),
  });
  if (!response.ok) {
    let message = `Support error ${response.status}`;
    try {
      const body = await response.json();
      message = body?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return response.json() as Promise<PostSupportMessageResponse>;
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
