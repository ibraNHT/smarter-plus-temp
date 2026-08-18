import { parseLocalYmd } from './parseLocalYmd';

/** True when `ymd` (YYYY-MM-DD) is a calendar date at least `minAge` years ago. */
export function isAtLeastAge(ymd: string, minAge = 18): boolean {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const dob = parseLocalYmd(ymd);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  const cutoff = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  return dob <= cutoff;
}

export function maxDobForAge(minAge = 18): string {
  const today = new Date();
  const cutoff = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const y = cutoff.getFullYear();
  const m = String(cutoff.getMonth() + 1).padStart(2, '0');
  const d = String(cutoff.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
