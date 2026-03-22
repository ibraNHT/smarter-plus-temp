import { apiFetch } from './apiService';
import type { ActiveReferralProgramPublic, MyReferralsData } from '../types';

function normalizeActiveProgram(raw: unknown): ActiveReferralProgramPublic | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  return {
    id: String(p.id ?? ''),
    name: String(p.name ?? ''),
    description: String(p.description ?? ''),
    referrerRewardAmount: Number(p.referrerRewardAmount ?? 0),
    refereeRewardAmount: Number(p.refereeRewardAmount ?? 0),
    currency: String(p.currency ?? 'USD'),
    minimumPayoutThreshold: Number(p.minimumPayoutThreshold ?? 0),
    termsUrl: String(p.termsUrl ?? ''),
  };
}

/** Normalizes JSON from GET /api/users/me/referrals. */
export function normalizeMyReferrals(raw: unknown): MyReferralsData | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const referredUsersRaw = o.referredUsers;
  const referredUsers = Array.isArray(referredUsersRaw)
    ? referredUsersRaw.map((u: unknown) => {
        const row = u && typeof u === 'object' ? (u as Record<string, unknown>) : {};
        const jd = row.joinedDate;
        const joinedDate =
          typeof jd === 'string'
            ? jd
            : jd instanceof Date
              ? jd.toISOString()
              : typeof jd === 'number'
                ? new Date(jd).toISOString()
                : '';
        return {
          id: String(row.id ?? ''),
          displayName: String(row.displayName ?? ''),
          joinedDate,
        };
      })
    : [];
  const totalReferred =
    typeof o.totalReferred === 'number' ? o.totalReferred : referredUsers.length;
  const activeProgram =
    o.activeProgram != null ? normalizeActiveProgram(o.activeProgram) : null;
  return {
    referralCode: String(o.referralCode ?? ''),
    totalReferred,
    referredUsers,
    activeProgram,
  };
}

/** Authenticated: loads referral code, count, referred users, and active program from the API. */
export async function fetchMyReferrals(): Promise<MyReferralsData | null> {
  try {
    const raw = await apiFetch<unknown>('/api/users/me/referrals', { silent401: true } as any);
    return normalizeMyReferrals(raw);
  } catch {
    return null;
  }
}

/** Public: active program for marketing (no auth). Same payload as `activeProgram` on me/referrals. */
export async function fetchActiveReferralProgramPublic(): Promise<ActiveReferralProgramPublic | null> {
  try {
    const raw = await apiFetch<unknown>('/api/referral-programs/active', { silent401: true } as any);
    return normalizeActiveProgram(raw);
  } catch {
    return null;
  }
}
