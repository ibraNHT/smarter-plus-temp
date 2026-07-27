#!/usr/bin/env node
/**
 * Regenerates favicons, PWA icons, and og-image from public/brand/ati-logo-source.png
 * Run: node scripts/generate-brand-assets.mjs
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourcePath = join(root, 'public', 'brand', 'ati-logo-source.png');
const publicDir = join(root, 'public');

if (!existsSync(sourcePath)) {
  console.error(`Source logo not found: ${sourcePath}`);
  process.exit(1);
}

const source = sharp(sourcePath).sharpen({ sigma: 0.5 });

async function writeSquare(size, filename) {
  const out = join(publicDir, filename);
  await source
    .clone()
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`Wrote ${filename} (${size}x${size})`);
}

async function writeOgImage() {
  const canvasWidth = 1200;
  const canvasHeight = 630;
  const maxLogoHeight = 580;

  const resizedLogo = await source
    .clone()
    .resize({ height: maxLogoHeight, fit: 'inside', withoutEnlargement: false })
    .sharpen({ sigma: 0.6 })
    .png()
    .toBuffer();

  const { width: logoWidth, height: logoHeight } = await sharp(resizedLogo).metadata();
  const left = Math.max(0, Math.floor((canvasWidth - (logoWidth ?? 0)) / 2));
  const top = Math.max(0, Math.floor((canvasHeight - (logoHeight ?? 0)) / 2));

  const out = join(publicDir, 'og-image.jpg');
  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: '#ffffff',
    },
  })
    .composite([{ input: resizedLogo, left, top }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(out);

  console.log(`Wrote og-image.jpg (${canvasWidth}x${canvasHeight})`);
}

await writeSquare(512, 'pwa-512x512.png');
await writeSquare(192, 'pwa-192x192.png');
await writeSquare(180, 'apple-touch-icon.png');
await writeSquare(32, 'favicon-32x32.png');
await writeSquare(16, 'favicon-16x16.png');

const faviconIco = join(publicDir, 'favicon.ico');
await sharp(join(publicDir, 'favicon-32x32.png')).png().toFile(faviconIco);
console.log('Wrote favicon.ico');

await writeOgImage();

async function writeLandingHeroWebp() {
  const heroJpg = join(publicDir, 'landing-hero.jpg');
  if (!existsSync(heroJpg)) {
    console.warn('landing-hero.jpg missing — skip WebP variants');
    return;
  }
  await sharp(heroJpg)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(join(publicDir, 'landing-hero.webp'));
  await sharp(heroJpg)
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(join(publicDir, 'landing-hero-960.webp'));
  console.log('Wrote landing-hero.webp + landing-hero-960.webp');
}

await writeLandingHeroWebp();
console.log('Brand assets generated from ati-logo-source.png');
