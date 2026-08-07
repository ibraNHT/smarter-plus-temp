/**
 * Build Open Graph HTML for social crawlers (WhatsApp, Facebook, etc.).
 * Pure ESM — used by the production static server.
 */

const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://acheteici.com').replace(/\/$/, '');
const SITE_NAME = 'AgriMarket Connect';
const FALLBACK_IMAGE = `${SITE_ORIGIN}/og-image.jpg`;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function apiBase() {
  const raw =
    process.env.OG_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    'https://api.acheteici.com';
  return String(raw).replace(/\/$/, '');
}

export function absoluteImageUrl(imageUrl, apiOrigin = apiBase()) {
  const trimmed = String(imageUrl ?? '').trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${apiOrigin}${trimmed}`;
  return `${apiOrigin}/${trimmed}`;
}

function pickProducerName(offer, producer) {
  if (producer) {
    if (producer.type === 'BUSINESS' || producer.businessName) {
      return producer.name || producer.businessName || producer.farmName;
    }
    const full = [producer.firstName, producer.lastName].filter(Boolean).join(' ').trim();
    if (full) return full;
    if (producer.name) return producer.name;
  }
  // Seller of record for ATI retail — keep in sync with i18n 'product.atiStoreName'.
  if (offer?.marketType === 'ATI' || offer?.market_type === 'ATI') return 'Achete Tout ICI Sarl';
  return offer?.producerName || offer?.sellerName || null;
}

function normalizeOffer(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw.offer && typeof raw.offer === 'object' ? raw.offer : raw;
  const id = o.id || o._id;
  if (!id) return null;
  return {
    id: String(id),
    title: o.title || o.name || 'AgriMarket offer',
    description: o.description || '',
    price: Number(o.price ?? o.unitPrice ?? 0),
    imageUrl: o.imageUrl || o.image_url || (Array.isArray(o.imageUrls) ? o.imageUrls[0] : '') || '',
    offerLocation: o.offerLocation || o.offer_location || o.location || '',
    producerId: o.producerId || o.producer_id || o.sellerId || '',
    marketType: o.marketType || o.market_type || '',
    producerName: o.producerName || null,
    rating: Number(o.averageRating ?? o.rating ?? 0) || 0,
    reviewCount: Number(o.reviewCount ?? o.reviewsCount ?? 0) || 0,
  };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function findInList(payload, id) {
  const lists = [];
  if (Array.isArray(payload)) lists.push(payload);
  if (Array.isArray(payload?.offers)) lists.push(payload.offers);
  if (Array.isArray(payload?.data)) lists.push(payload.data);
  if (Array.isArray(payload?.items)) lists.push(payload.items);
  for (const list of lists) {
    const hit = list.find((item) => String(item?.id || item?._id) === String(id));
    if (hit) return normalizeOffer(hit);
  }
  return null;
}

export async function fetchOfferForOg(offerId) {
  const base = apiBase();
  const id = encodeURIComponent(offerId);

  // Prefer single-resource endpoints, then list scans.
  const candidates = [
    `${base}/api/offers/${id}`,
    `${base}/api/retail/offers/${id}`,
    `${base}/api/marketplace/offers/${id}`,
  ];

  for (const url of candidates) {
    const data = await fetchJson(url);
    const offer = normalizeOffer(data) || findInList(data, offerId);
    if (offer) {
      await enrichOffer(offer, base);
      return offer;
    }
  }

  for (const listUrl of [`${base}/api/offers`, `${base}/api/retail/offers`]) {
    const data = await fetchJson(listUrl);
    const offer = findInList(data, offerId);
    if (offer) {
      await enrichOffer(offer, base);
      return offer;
    }
  }

  return null;
}

async function enrichOffer(offer, base) {
  if (!offer.producerId) return;
  const producerPayload = await fetchJson(`${base}/api/producers/${encodeURIComponent(offer.producerId)}`);
  const producer =
    producerPayload?.producer ||
    producerPayload?.data ||
    (producerPayload?.id ? producerPayload : null);
  const name = pickProducerName(offer, producer);
  if (name) offer.producerName = name;

  if (!offer.rating && producer) {
    const rating = Number(producer.averageRating ?? producer.rating ?? 0);
    if (rating > 0) offer.rating = rating;
  }
}

export function buildOfferOgDescription(offer) {
  const bits = [];
  if (offer.price != null && Number.isFinite(offer.price)) {
    bits.push(`${Number(offer.price).toLocaleString('en-US')} XAF`);
  }
  if (offer.offerLocation) bits.push(offer.offerLocation);
  if (offer.producerName) bits.push(`by ${offer.producerName}`);
  if (offer.rating > 0) bits.push(`★ ${Number(offer.rating).toFixed(1)}`);
  const meta = bits.join(' · ');
  const body = String(offer.description || '').replace(/\s+/g, ' ').trim();
  const clipped = body.length > 140 ? `${body.slice(0, 137)}…` : body;
  if (meta && clipped) return `${offer.title} — ${meta}. ${clipped}`;
  if (meta) return `${offer.title} — ${meta}`;
  return clipped || `${offer.title} on ${SITE_NAME}`;
}

export function buildOfferOgHtml(offer, { requestOrigin } = {}) {
  const pageOrigin = (requestOrigin || SITE_ORIGIN).replace(/\/$/, '');
  const pageUrl = `${pageOrigin}/offer/${encodeURIComponent(offer.id)}`;
  const title = `${offer.title} | ${SITE_NAME}`;
  const description = buildOfferOgDescription(offer);
  const image = absoluteImageUrl(offer.imageUrl);
  const price = Number.isFinite(offer.price) ? String(offer.price) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(pageUrl)}" />

  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:alt" content="${escapeHtml(offer.title)}" />
  ${price ? `<meta property="product:price:amount" content="${escapeHtml(price)}" />` : ''}
  ${price ? `<meta property="product:price:currency" content="XAF" />` : ''}
  ${price ? `<meta property="og:price:amount" content="${escapeHtml(price)}" />` : ''}
  ${price ? `<meta property="og:price:currency" content="XAF" />` : ''}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(pageUrl)}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>
  <main style="font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem;">
    <h1>${escapeHtml(offer.title)}</h1>
    <p>${escapeHtml(description)}</p>
    <p><img src="${escapeHtml(image)}" alt="${escapeHtml(offer.title)}" style="max-width:100%;border-radius:12px;" /></p>
    <p><a href="${escapeHtml(pageUrl)}">View this offer on ${escapeHtml(SITE_NAME)}</a></p>
  </main>
</body>
</html>`;
}

export function buildFallbackOgHtml(offerId, { requestOrigin } = {}) {
  const pageOrigin = (requestOrigin || SITE_ORIGIN).replace(/\/$/, '');
  const pageUrl = `${pageOrigin}/offer/${encodeURIComponent(offerId)}`;
  const title = `Offer | ${SITE_NAME}`;
  const description = `View this agricultural offer on ${SITE_NAME}.`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(FALLBACK_IMAGE)}" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body>
  <p><a href="${escapeHtml(pageUrl)}">Open offer</a></p>
</body>
</html>`;
}

export const SOCIAL_BOT_UA =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|Discordbot|TelegramBot|SkypeUriPreview|Pinterest|redditbot|Embedly|Quora Link Preview|Showyoubot|outbrain|vkShare|W3C_Validator|Googlebot|bingbot|Baiduspider|DuckDuckBot|Slurp|Applebot|Iframely|meta-externalagent/i;

export function isSocialBot(userAgent) {
  return SOCIAL_BOT_UA.test(String(userAgent || ''));
}
