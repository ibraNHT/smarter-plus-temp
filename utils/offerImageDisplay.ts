/**
 * Styling for offer / cart / product photos in a fixed box.
 * `object-cover` crops to fill the frame and often looks "zoomed in";
 * `object-contain` shows the full image with possible letterboxing on a neutral background.
 */
export const offerImageInBox = 'h-full w-full object-contain object-center';

/** Large detail/hero: center in padded area, never crop the photo. */
export const offerImageHero =
  'max-h-full max-w-full object-contain object-center';

export type OfferImageSize = 'thumb' | 'card' | 'detail';

const CLOUDINARY_TRANSFORMS: Record<OfferImageSize, string> = {
  // Avoid c_fill on first paint — crop transforms are slower to derive on cold CDN.
  thumb: 'w_160,h_160,c_fill,f_auto,q_auto',
  card: 'w_400,f_auto,q_auto',
  detail: 'w_800,f_auto,q_auto',
};

/** Local SVG — no third-party placeholder hop on broken images. */
export const OFFER_IMAGE_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect fill="#e5e7eb" width="400" height="300"/>
      <text x="200" y="158" text-anchor="middle" fill="#6b7280" font-family="system-ui,sans-serif" font-size="18">No image</text>
    </svg>`,
  );

/** Swap broken/missing remote images to the placeholder so cards are not blank white. */
export function onOfferImageError(event: { currentTarget: HTMLImageElement }) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = OFFER_IMAGE_PLACEHOLDER;
}

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
  if (trimmed.startsWith('data:')) return trimmed;
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

/**
 * Insert Cloudinary delivery transforms after `/upload/` (same pattern as compliance thumbs).
 * Non-Cloudinary URLs are returned unchanged.
 */
export function offerImageThumb(
  url?: string | null,
  size: OfferImageSize = 'card',
): string {
  const resolved = resolveOfferImageSrc(url);
  if (!resolved || resolved === OFFER_IMAGE_PLACEHOLDER || resolved.startsWith('data:')) {
    return resolved;
  }
  if (!resolved.includes('res.cloudinary.com') || !resolved.includes('/upload/')) {
    return resolved;
  }

  const marker = '/upload/';
  const idx = resolved.indexOf(marker);
  if (idx === -1) return resolved;

  const transform = CLOUDINARY_TRANSFORMS[size];
  let after = resolved.slice(idx + marker.length);
  // Drop an existing transform segment so we don't stack transforms.
  // Transforms look like "w_400,c_fill,f_auto/" before the version/path.
  if (/^[a-z]+_/i.test(after) && after.includes(',')) {
    after = after.replace(/^[^/]+\//, '');
  }
  return `${resolved.slice(0, idx + marker.length)}${transform}/${after}`;
}
