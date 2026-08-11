/**
 * Support session REST API — aligned with Nest `SupportController` (/api/support/*).
 */

import type { SupportMessage } from '../types';
import { apiFetch, getToken } from './apiService';
import { logApiWarn } from './apiDebug';
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
  // silent401: a support click must never force a logout/redirect.
  return apiFetch<CreateSupportSessionResponse>(API_ENDPOINTS.support.sessions, {
    method: 'POST',
    body: JSON.stringify({}),
    silent401: true,
  } as any);
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
    logApiWarn(`Support messages poll failed: ${e?.message || 'unknown'}`, e);
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

/**
 * Guest poll payload: messages **and** the session status.
 *
 * Guests get no WebSocket (it is JWT-gated) and have no session-detail endpoint,
 * so this single poll is the only channel by which an admin's status change —
 * assign to me, return to AI, close — can reach the guest widget. The endpoint
 * previously returned no status at all, which is why the guest side never
 * reacted to anything the Console did.
 *
 * It returns `{ messages: [...] }` (an object) unlike the authenticated endpoint
 * which returns a bare array; both shapes are unwrapped so callers always get an
 * array — otherwise an `Array.isArray` guard drops every agent reply.
 */
export async function getGuestSupportSnapshot(
  sessionId: string,
  guestEmail: string,
): Promise<{ messages: SupportMessageDto[]; status: string | null }> {
  try {
    const res = await apiGet<
      SupportMessageDto[] | { messages: SupportMessageDto[]; status?: string | null }
    >(API_ENDPOINTS.support.guestSessionMessages(sessionId, guestEmail), { silent401: true });
    if (Array.isArray(res)) return { messages: res, status: null };
    return {
      messages: Array.isArray((res as any)?.messages) ? (res as any).messages : [],
      status: typeof (res as any)?.status === 'string' ? (res as any).status : null,
    };
  } catch {
    return { messages: [], status: null };
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

/** User resets their own session from WAITING_FOR_AGENT / AGENT_ACTIVE back to AI_HANDLING. */
export async function returnSessionToAi(sessionId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(
    `${API_ENDPOINTS.support.sessions}/${sessionId}/return-to-ai`,
    { method: 'POST' },
  );
}

/** Logged-in user escalates their session to a human agent (WAITING_FOR_AGENT). */
export async function requestSupportAgent(
  sessionId: string,
): Promise<{ ok: boolean; status: string }> {
  return apiFetch<{ ok: boolean; status: string }>(
    API_ENDPOINTS.support.requestAgent(sessionId),
    { method: 'POST', silent401: true } as any,
  );
}

/** Guest escalates their session to a human agent (guestEmail must match session). */
export async function requestGuestSupportAgent(
  sessionId: string,
  guestEmail: string,
): Promise<{ ok: boolean; status: string }> {
  return apiPost<{ ok: boolean; status: string }>(
    API_ENDPOINTS.support.guestRequestAgent(sessionId),
    { guestEmail },
    { silent401: true },
  );
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

/**
 * Reconcile the local message list against authoritative server history.
 *
 * Server messages are the source of truth, so we take them as-is and then append
 * only the LOCAL optimistic placeholders (temp ids `u-`/`a-`/`s-`) whose text the
 * server does NOT yet have — i.e. still-sending, failed, or "connecting…" bubbles.
 * This both removes the duplicates that a plain id-based append produces (server
 * UUIDs never match optimistic ids) AND preserves un-persisted messages (e.g. a
 * FAILED send with its retry button) that a blind replace would silently drop.
 *
 * IMPORTANT: callers must NOT pass an empty `server` array from a failed fetch —
 * guard with `server.length > 0` so an errored poll never wipes the thread.
 */
export function reconcileServerMessages<
  T extends { id: string; sender: string; text: string }
>(prev: T[], server: T[]): T[] {
  const serverKeys = new Set(server.map((m) => `${m.sender}::${m.text}`));
  const isOptimistic = (id: string) =>
    id.startsWith('u-') || id.startsWith('a-') || id.startsWith('s-');
  const pending = prev.filter(
    (m) => isOptimistic(m.id) && !serverKeys.has(`${m.sender}::${m.text}`)
  );
  return [...server, ...pending];
}
