/**
 * Production static file server with social-bot Open Graph for /offer/:id.
 * Humans always get the SPA; crawlers get offer-specific OG HTML.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFallbackOgHtml,
  buildOfferOgHtml,
  fetchOfferForOg,
  isSocialBot,
} from './buildOfferOgHtml.mjs';

//random psuh 
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = process.env.STATIC_ROOT
  ? path.resolve(process.env.STATIC_ROOT)
  : path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT || 80);
const HOST = process.env.HOST || '0.0.0.0';
//asda
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, normalized);
  if (!full.startsWith(root)) return null;
  return full;
}

function sendFile(res, filePath, { cacheControl } = {}) {
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, {
    'Content-Type': contentType(filePath),
    ...(cacheControl ? { 'Cache-Control': cacheControl } : {}),
  });
  stream.pipe(res);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500);
    res.end('Internal Server Error');
  });
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  });
  res.end(html);
}

function requestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'acheteici.com';
  const forwarded = req.headers['x-forwarded-proto'];
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(host).split(',')[0].trim());
  const proto = forwarded || (local ? 'http' : 'https');
  return `${String(proto).split(',')[0].trim()}://${String(host).split(',')[0].trim()}`;
}

async function handleOfferBot(req, res, offerId) {
  const origin = requestOrigin(req);
  try {
    const offer = await fetchOfferForOg(offerId);
    if (offer) {
      sendHtml(res, 200, buildOfferOgHtml(offer, { requestOrigin: origin }));
      return;
    }
  } catch (err) {
    console.error('[og] failed to build offer preview', offerId, err?.message || err);
  }
  sendHtml(res, 200, buildFallbackOgHtml(offerId, { requestOrigin: origin }));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  const offerMatch = pathname.match(/^\/offer\/([^/]+)\/?$/);
  if (offerMatch && isSocialBot(req.headers['user-agent'])) {
    await handleOfferBot(req, res, offerMatch[1]);
    return;
  }

  // Static assets
  let filePath = safeJoin(DIST_DIR, pathname === '/' ? '/index.html' : pathname);
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const isHashedAsset = pathname.startsWith('/assets/');
    const isShell = pathname === '/' || pathname.endsWith('.html') || pathname === '/sw.js' || pathname === '/index.html';
    sendFile(res, filePath, {
      cacheControl: isHashedAsset
        ? 'public, max-age=31536000, immutable'
        : isShell
          ? 'no-cache, no-store, must-revalidate'
          : 'public, max-age=3600',
    });
    return;
  }

  // SPA fallback
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    sendFile(res, indexPath, { cacheControl: 'no-cache, no-store, must-revalidate' });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`[static-og] serving ${DIST_DIR} on http://${HOST}:${PORT}`);
  console.log(`[static-og] OG API base: ${process.env.OG_API_BASE_URL || process.env.VITE_API_BASE_URL || '(default)'}`);
});
