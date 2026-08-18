#!/usr/bin/env node
/**
 * Prerenders critical public routes into dist/prerendered/ for crawlers and social bots.
 * Requires: yarn build first, then node scripts/prerender-routes.mjs
 * Optional devDependency: puppeteer (yarn add -D puppeteer)
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const prerenderDir = join(distDir, 'prerendered');

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

const ROUTES = [
  '/',
  '/market/producers',
  '/market/ati',
  '/register',
  '/register/client',
  '/register/producer',
  '/help',
  '/faq',
  '/terms',
  '/privacy',
  '/account-deletion',
  '/blog',
  '/jobs',
  '/partners',
  ...HELP_TOPIC_IDS.map((id) => `/help/${id}`),
];

if (!existsSync(distDir)) {
  console.error('dist/ not found. Run yarn build first.');
  process.exit(1);
}

let puppeteer;
try {
  puppeteer = await import('puppeteer');
} catch {
  console.warn('puppeteer not installed — skipping prerender. Install with: yarn add -D puppeteer');
  process.exit(0);
}

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const urlPath = req.url?.split('?')[0] ?? '/';
      let filePath = join(distDir, urlPath === '/' ? 'index.html' : urlPath);
      if (!existsSync(filePath)) {
        filePath = join(distDir, 'index.html');
      }
      const ext = filePath.slice(filePath.lastIndexOf('.'));
      res.writeHead(200, { 'Content-Type': mime[ext] ?? 'application/octet-stream' });
      res.end(readFileSync(filePath));
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

mkdirSync(prerenderDir, { recursive: true });

const { server, port } = await startStaticServer();
const browser = await puppeteer.default.launch({ headless: true });
const page = await browser.newPage();

for (const route of ROUTES) {
  const url = `http://127.0.0.1:${port}${route}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 500));
  const html = await page.content();
  const outDir = join(prerenderDir, route === '/' ? '' : route);
  mkdirSync(outDir, { recursive: true });
  const outFile = route === '/' ? join(prerenderDir, 'index.html') : join(outDir, 'index.html');
  writeFileSync(outFile, html, 'utf8');
  console.log(`Prerendered ${route}`);
}

await browser.close();
server.close();
console.log(`Prerendered ${ROUTES.length} routes to ${prerenderDir}`);
