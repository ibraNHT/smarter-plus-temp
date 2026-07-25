/**
 * Styling for offer / cart / product photos in a fixed box.
 * `object-cover` crops to fill the frame and often looks "zoomed in";
 * `object-contain` shows the full image with possible letterboxing on a neutral background.
 */
export const offerImageInBox = 'h-full w-full object-contain object-center';

/** Large detail/hero: center in padded area, never crop the photo. */
export const offerImageHero =
  'max-h-full max-w-full object-contain object-center';

/** Shown when imageUrl is missing or failed to load. */
export const OFFER_IMAGE_PLACEHOLDER =
  'https://placehold.co/400x300/e5e7eb/6b7280?text=No+image';

/** Swap broken/missing remote images to the placeholder so cards are not blank white. */
export function onOfferImageError(event: { currentTarget: HTMLImageElement }) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = OFFER_IMAGE_PLACEHOLDER;
}

const API_ORIGINS = (() => {
  const bases = new Set<string>();
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw) {
    try {
      bases.add(new URL(raw.replace(/\/$/, '')).origin);
    } catch {
      bases.add(raw.replace(/\/$/, ''));
    }
  }
  bases.add('http://localhost:4040');
  bases.add('http://127.0.0.1:4040');
  return bases;
})();

/**
 * Safe <img src> for offer photos.
 *
 * Local API uploads return absolute URLs like http://localhost:4040/uploads/offers/x.png
 * while the Vite app runs on :5173. Helmet sets Cross-Origin-Resource-Policy on the API,
 * so the browser blocks those images (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin) even at HTTP 200.
 *
 * Rewrite to /uploads/... so Vite's dev proxy serves them same-origin (see vite.config.ts).
 * Cloudinary https:// URLs are returned unchanged.
 */
export function resolveOfferImageSrc(url?: string | null): string {
  const trimmed = String(url ?? '').trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return OFFER_IMAGE_PLACEHOLDER;
  }
  if (trimmed.startsWith('/uploads/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.pathname.startsWith('/uploads/') &&
      (API_ORIGINS.has(parsed.origin) ||
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1')
    ) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* relative or invalid URL — use as-is */
  }
  return trimmed;
}
