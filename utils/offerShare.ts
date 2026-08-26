import { getPublicWebOrigin } from '../services/nativePlatform';

/** Canonical path-style offer URL for sharing (never hash routes). */
export function buildOfferShareUrl(offerId: string, origin?: string): string {
  const base = origin ?? getPublicWebOrigin();
  return `${base.replace(/\/$/, '')}/offer/${encodeURIComponent(offerId)}`;
}

export type OfferShareTextInput = {
  title: string;
  price?: number | null;
  location?: string | null;
  rating?: number | null;
  producerName?: string | null;
  currency?: string;
};

/** Engaging caption for native share sheets (WhatsApp, Instagram, etc.). */
export function buildOfferShareText(input: OfferShareTextInput): string {
  const currency = input.currency ?? 'XAF';
  const parts: string[] = [input.title.trim() || 'AgriMarket offer'];

  if (input.price != null && Number.isFinite(Number(input.price))) {
    parts.push(`${Number(input.price).toLocaleString()} ${currency}`);
  }
  if (input.location?.trim()) {
    parts.push(input.location.trim());
  }
  if (input.producerName?.trim()) {
    parts.push(`by ${input.producerName.trim()}`);
  }
  if (input.rating != null && input.rating > 0) {
    parts.push(`★ ${Number(input.rating).toFixed(1)}`);
  }

  parts.push('— AgriMarket Connect');
  return parts.join(' · ');
}

/** SEO / Open Graph description with price, location, producer, rating. */
export function buildOfferSeoDescription(input: OfferShareTextInput & { description?: string | null }): string {
  const currency = input.currency ?? 'XAF';
  const bits: string[] = [];

  if (input.price != null && Number.isFinite(Number(input.price))) {
    bits.push(`${Number(input.price).toLocaleString()} ${currency}`);
  }
  if (input.location?.trim()) bits.push(input.location.trim());
  if (input.producerName?.trim()) bits.push(`by ${input.producerName.trim()}`);
  if (input.rating != null && input.rating > 0) {
    bits.push(`★ ${Number(input.rating).toFixed(1)}`);
  }

  const metaLine = bits.length ? bits.join(' · ') : '';
  const body = (input.description ?? '').trim().replace(/\s+/g, ' ');
  const clipped = body.length > 140 ? `${body.slice(0, 137)}…` : body;

  if (metaLine && clipped) return `${input.title} — ${metaLine}. ${clipped}`;
  if (metaLine) return `${input.title} — ${metaLine}`;
  if (clipped) return clipped;
  return `${input.title} on AgriMarket Connect`;
}

/**
 * Absolute image URL for OG crawlers.
 * Keeps https Cloudinary URLs; prefixes API origin for relative /uploads paths.
 */
export function absoluteOfferImageUrl(
  imageUrl: string | null | undefined,
  apiBaseUrl?: string,
): string {
  const trimmed = String(imageUrl ?? '').trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return 'https://acheteici.com/og-image.jpg';
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const api =
    apiBaseUrl?.replace(/\/$/, '') ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
      ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
      : 'https://api.acheteici.com');

  if (trimmed.startsWith('/')) return `${api}${trimmed}`;
  return `${api}/${trimmed}`;
}
