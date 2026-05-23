import { OFFER_IMAGE_PLACEHOLDER, resolveOfferImageSrc } from './offerImageDisplay';

/** Primary + additional offer images (deduped, order preserved). */
export function getOfferImageUrls(offer: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
}): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const raw of [offer.imageUrl, ...(offer.imageUrls ?? [])]) {
    const trimmed = String(raw ?? '').trim();
    if (!trimmed || seen.has(trimmed)) continue;
    const u = resolveOfferImageSrc(trimmed);
    if (u === OFFER_IMAGE_PLACEHOLDER || seen.has(u)) continue;
    seen.add(u);
    urls.push(u);
  }
  return urls;
}
