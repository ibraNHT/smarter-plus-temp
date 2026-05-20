/** Primary + additional offer images (deduped, order preserved). */
export function getOfferImageUrls(offer: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
}): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const raw of [offer.imageUrl, ...(offer.imageUrls ?? [])]) {
    const u = String(raw ?? '').trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    urls.push(u);
  }
  return urls;
}
