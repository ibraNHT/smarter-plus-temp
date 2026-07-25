#!/usr/bin/env node
/**
 * Generates a solid PNG icon for the Smarter Panel PWA.
 * Uses only built-in Node.js — no native addons required.
 * Outputs valid PNG files that iOS, Android, and desktop browsers will accept.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public');

// ── PNG encoder ──────────────────────────────────────────────────────────────
function crc32(buf) {
    let crc = 0xffffffff;
    const table = [];
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[i] = c;
    }
    for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    const crcData = Buffer.concat([typeBytes, data]);
    crcBuf.writeUInt32BE(crc32(crcData));
    return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function encodePNG(pixels, w, h) {
    // pixels: Uint8Array of RGBA values, row-major
    const raw = [];
    for (let y = 0; y < h; y++) {
        raw.push(0); // filter byte = None
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            raw.push(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
        }
    }
    const compressed = zlib.deflateSync(Buffer.from(raw), { level: 6 });

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 2;  // colour type = RGB (we'll use RGBA=6 below)
    ihdr[9] = 6;  // RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
        chunk('IHDR', ihdr),
        chunk('IDAT', compressed),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

// ── Colour helpers ────────────────────────────────────────────────────────────
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
    ];
}

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor(c1, c2, t) {
    return [
        Math.round(lerp(c1[0], c2[0], t)),
        Math.round(lerp(c1[1], c2[1], t)),
        Math.round(lerp(c1[2], c2[2], t)),
    ];
}

function setPixel(pixels, w, x, y, r, g, b, a = 255) {
    if (x < 0 || x >= w || y < 0) return;
    const h = pixels.length / 4 / w;
    if (y >= h) return;
    const i = (Math.round(y) * w + Math.round(x)) * 4;
    if (i < 0 || i + 3 >= pixels.length) return;
    // Alpha blending over existing pixel
    const src_a = a / 255;
    const dst_a = pixels[i + 3] / 255;
    const out_a = src_a + dst_a * (1 - src_a);
    if (out_a === 0) return;
    pixels[i] = Math.round((r * src_a + pixels[i] * dst_a * (1 - src_a)) / out_a);
    pixels[i + 1] = Math.round((g * src_a + pixels[i + 1] * dst_a * (1 - src_a)) / out_a);
    pixels[i + 2] = Math.round((b * src_a + pixels[i + 2] * dst_a * (1 - src_a)) / out_a);
    pixels[i + 3] = Math.round(out_a * 255);
}

// Draw a filled circle with anti-aliasing
function fillCircle(pixels, w, cx, cy, radius, color, alpha = 255) {
    const [r, g, b] = color;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
        for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist <= radius) {
                const a_fac = Math.min(1, radius - dist + 0.5);
                setPixel(pixels, w, x, y, r, g, b, Math.round(a_fac * alpha));
            }
        }
    }
}

// Fill a rounded rectangle
function fillRoundedRect(pixels, w, rx, ry, rw, rh, radius, color, alpha = 255) {
    const [r, g, b] = color;
    for (let y = Math.floor(ry); y <= Math.ceil(ry + rh); y++) {
        for (let x = Math.floor(rx); x <= Math.ceil(rx + rw); x++) {
            // Determine if inside rounded rect
            const cx = Math.max(rx + radius, Math.min(x, rx + rw - radius));
            const cy = Math.max(ry + radius, Math.min(y, ry + rh - radius));
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist <= radius + 0.5) {
                const a_fac = Math.min(1, radius - dist + 1);
                setPixel(pixels, w, x, y, r, g, b, Math.round(a_fac * alpha));
            }
        }
    }
}

// Vertical gradient fill for bar
function fillGradientBar(pixels, w, bx, by, bw, bh, topColor, botColor, cornerR) {
    for (let y = Math.floor(by); y <= Math.ceil(by + bh); y++) {
        const t = (y - by) / bh;
        const [r, g, b] = lerpColor(topColor, botColor, t);
        for (let x = Math.floor(bx); x <= Math.ceil(bx + bw); x++) {
            // Corner rounding only at top
            let alpha = 255;
            const topLeft = Math.sqrt((x - (bx + cornerR)) ** 2 + (y - (by + cornerR)) ** 2);
            const topRight = Math.sqrt((x - (bx + bw - cornerR)) ** 2 + (y - (by + cornerR)) ** 2);
            if (y < by + cornerR) {
                if (x < bx + cornerR && topLeft > cornerR) alpha = 0;
                else if (x > bx + bw - cornerR && topRight > cornerR) alpha = 0;
            }
            if (alpha > 0) setPixel(pixels, w, x, y, r, g, b, alpha);
        }
    }
}

// Draw a thick line (stroke) between two points
function drawThickLine(pixels, w, x1, y1, x2, y2, thickness, color, alpha = 255) {
    const [r, g, b] = color;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(len * 2);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t;
        const py = y1 + dy * t;
        fillCircle(pixels, w, px, py, thickness / 2, [r, g, b], alpha);
    }
}

// ── Main draw function ────────────────────────────────────────────────────────
function drawIcon(size) {
    const pixels = new Uint8Array(size * size * 4); // RGBA, init = transparent
    const s = size;

    // BG gradient (dark navy)
    for (let y = 0; y < s; y++) {
        const t = y / s;
        const [r, g, b] = lerpColor([15, 23, 42], [30, 27, 75], t); // #0F172A → #1E1B4B
        for (let x = 0; x < s; x++) {
            const i = (y * s + x) * 4;
            pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255;
        }
    }

    // Clip to rounded rect by zeroing outside corners
    const rad = s * 0.22;
    for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
            const cx = Math.max(rad, Math.min(x, s - rad));
            const cy = Math.max(rad, Math.min(y, s - rad));
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist > rad) {
                const i = (y * s + x) * 4;
                pixels[i + 3] = 0; // transparent outside
            }
        }
    }

    // Chart bars
    const barW = s * 0.12;
    const barGap = s * 0.065;
    const baseline = s * 0.78;
    const bars = [
        { h: s * 0.22, top: [56, 189, 248], bot: [45, 212, 191] },  // sky → teal
        { h: s * 0.42, top: [129, 140, 248], bot: [99, 102, 241] }, // indigo
        { h: s * 0.60, top: [244, 114, 182], bot: [168, 85, 247] }, // pink → purple
        { h: s * 0.32, top: [52, 211, 153], bot: [6, 182, 212] },   // emerald → cyan
    ];
    const totalWidth = bars.length * barW + (bars.length - 1) * barGap;
    const barsStartX = (s - totalWidth) / 2;
    const cornerR = barW * 0.4;

    bars.forEach((bar, idx) => {
        const bx = barsStartX + idx * (barW + barGap);
        const by = baseline - bar.h;
        fillGradientBar(pixels, s, bx, by, barW, bar.h, bar.top, bar.bot, cornerR);
    });

    // Trend line dots
    const pts = [
        [barsStartX + 0 * (barW + barGap) + barW / 2, baseline - bars[0].h],
        [barsStartX + 1 * (barW + barGap) + barW / 2, baseline - bars[1].h],
        [barsStartX + 2 * (barW + barGap) + barW / 2, baseline - bars[2].h],
        [barsStartX + 3 * (barW + barGap) + barW / 2, baseline - bars[3].h],
    ];

    // Lines between consecutive points
    const lineColors = [
        [45, 212, 191],
        [129, 140, 248],
        [244, 114, 182],
    ];
    for (let i = 0; i < pts.length - 1; i++) {
        drawThickLine(pixels, s, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], s * 0.035, lineColors[i]);
    }

    // Dot outlines
    const dotColors = [[45, 212, 191], [129, 140, 248], [244, 114, 182], [52, 211, 153]];
    pts.forEach(([px, py], i) => {
        fillCircle(pixels, s, px, py, s * 0.055, dotColors[i]);
        fillCircle(pixels, s, px, py, s * 0.032, [15, 23, 42]);
    });

    return encodePNG(pixels, s, s);
}

// ── Output ────────────────────────────────────────────────────────────────────
const targets = [
    { file: 'smarter-pwa-512x512.png', size: 512 },
    { file: 'smarter-pwa-192x192.png', size: 192 },
    { file: 'smarter-apple-touch-icon.png', size: 180 },
    { file: 'favicon.ico', size: 32 },
];

for (const { file, size } of targets) {
    const buf = drawIcon(size);
    fs.writeFileSync(path.join(outDir, file), buf);
    console.log(`✓ Generated ${file} (${size}×${size}, ${buf.length} bytes)`);
}
