/** Path-style referral URLs for BrowserRouter (never hash routes). */

export function buildClientReferralLink(referralCode: string, origin?: string): string {
  const base = (origin ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  return `${base}/register/client?ref=${encodeURIComponent(referralCode.trim())}`;
}

export function buildProducerReferralLink(referralCode: string, origin?: string): string {
  const base = (origin ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  // Choice page preserves ref into /register/client and /register/producer
  return `${base}/register?ref=${encodeURIComponent(referralCode.trim())}`;
}

/**
 * BrowserRouter only reads location.search. Old shared links put `ref` in the hash
 * (`/#/register/client?ref=CODE`). Recover it so legacy invites still attribute.
 */
export function readReferralCodeFromLocation(searchParams: URLSearchParams): string | null {
  const fromSearch = searchParams.get('ref')?.trim();
  if (fromSearch) return fromSearch;

  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex < 0) return null;
  const fromHash = new URLSearchParams(hash.slice(qIndex)).get('ref')?.trim();
  return fromHash || null;
}
