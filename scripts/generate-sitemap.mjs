#!/usr/bin/env node
/**
 * Generates public/sitemap.xml for acheteici.com.
 * Run: node scripts/generate-sitemap.mjs
 * Optional: SITEMAP_API_URL=https://api.example.com node scripts/generate-sitemap.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://acheteici.com';
const today = new Date().toISOString().slice(0, 10);

const HELP_TOPIC_IDS = [
  'getting-started',
  'accounts-security',
  'marketplace-buying',
  'selling-producer',
  'retail-store',
  'orders-delivery-pickup',
  'payments-wallet-withdrawals',
  'coupons-referrals',
  'chat-negotiation-safety',
  'support-disputes',
  'notifications',
  'faq',
  'troubleshooting',
  'policy-links',
];

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/market/producers', changefreq: 'hourly', priority: '0.9' },
  { path: '/market/ati', changefreq: 'hourly', priority: '0.9' },
  { path: '/register', changefreq: 'monthly', priority: '0.8' },
  { path: '/register/client', changefreq: 'monthly', priority: '0.8' },
  { path: '/register/producer', changefreq: 'monthly', priority: '0.8' },
  { path: '/help', changefreq: 'weekly', priority: '0.8' },
  { path: '/faq', changefreq: 'weekly', priority: '0.7' },
  { path: '/terms', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.6' },
  { path: '/blog', changefreq: 'weekly', priority: '0.6' },
  { path: '/jobs', changefreq: 'monthly', priority: '0.5' },
  { path: '/partners', changefreq: 'monthly', priority: '0.5' },
  ...HELP_TOPIC_IDS.map((id) => ({
    path: `/help/${id}`,
    changefreq: 'monthly',
    priority: '0.6',
  })),
];

async function fetchOfferPaths() {
  const apiBase = process.env.SITEMAP_API_URL?.replace(/\/$/, '');
  if (!apiBase) return [];

  try {
    const response = await fetch(`${apiBase}/api/offers`);
    if (!response.ok) return [];
    const offers = await response.json();
    if (!Array.isArray(offers)) return [];
    return offers
      .filter((offer) => offer?.id)
      .map((offer) => ({
        path: `/offer/${offer.id}`,
        changefreq: 'daily',
        priority: '0.8',
      }));
  } catch {
    return [];
  }
}

function toUrlEntry({ path, changefreq, priority }) {
  return `  <url>
    <loc>${ORIGIN}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const offerRoutes = await fetchOfferPaths();
const allRoutes = [...STATIC_ROUTES, ...offerRoutes];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(toUrlEntry).join('\n')}
</urlset>
`;

const outPath = join(__dirname, '..', 'public', 'sitemap.xml');
writeFileSync(outPath, xml, 'utf8');
console.log(`Wrote ${allRoutes.length} URLs to ${outPath}`);
