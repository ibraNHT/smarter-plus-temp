import { nativeStorageGet, nativeStorageSet } from './nativeStorage';
import { apiFetch, getToken } from './apiService';
import { API_ENDPOINTS } from '../client-api/endpoints';
import { openExternalUrl } from './nativeBrowser';

const BLOCKED_KEY = 'agm_blocked_user_ids';
export const BLOCKLIST_EVENT = 'agm-blocklist-changed';

export type ReportTargetType = 'USER' | 'CHAT' | 'OFFER' | 'REVIEW';

const parseIds = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const getBlockedUserIds = (): string[] => parseIds(nativeStorageGet(BLOCKED_KEY));

export const isUserBlocked = (userId?: string | null): boolean => {
  if (!userId) return false;
  return getBlockedUserIds().includes(userId);
};

export const blockUserId = (userId: string): void => {
  if (!userId) return;
  const next = Array.from(new Set([...getBlockedUserIds(), userId]));
  nativeStorageSet(BLOCKED_KEY, JSON.stringify(next));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BLOCKLIST_EVENT));
};

export async function submitContentReport(payload: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}): Promise<void> {
  const body = {
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason.trim(),
  };
  if (getToken()) {
    try {
      await apiFetch(API_ENDPOINTS.reports.create, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return;
    } catch {
      /* API may not be deployed yet — fall through to mail so the user can still report. */
    }
  }
  const subject = encodeURIComponent(`AgriMarket Connect report (${payload.targetType})`);
  const mail = encodeURIComponent(
    `Please review this content.\nType: ${payload.targetType}\nId: ${payload.targetId}\nReason: ${payload.reason.trim()}`,
  );
  await openExternalUrl(`mailto:helpdesk@acheteici.com?subject=${subject}&body=${mail}`);
}
