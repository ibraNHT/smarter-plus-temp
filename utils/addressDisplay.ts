/**
 * Reverse-geocoded addresses (Google Places / Nominatim) can be very long,
 * multi-segment, and mixed-script (e.g. "Tanveerabad, تاج پُورہ, Kotli Abdur
 * Rahman, Shalimar Tehsil, Lahore District, Lahore Division, Punjab, 54840,
 * Pakistan") — they overflow selects, pills, and summary rows.
 */

/** Tailwind classes for single-line address truncation inside flex/block layouts. */
export const addressTruncateClass = 'truncate min-w-0 max-w-full';

/**
 * String-level truncation for contexts where CSS ellipsis isn't reliable
 * (native <option> elements, dropdown labels). Prefer `addressTruncateClass`
 * + a `title` attribute wherever the element supports CSS truncation instead.
 */
export function truncateAddress(address: string | undefined | null, maxLength = 60): string {
  const trimmed = (address ?? '').trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}
