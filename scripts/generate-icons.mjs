#!/usr/bin/env node
// Icon + OG image generator for Ramen Guide.
//
// Rasterizes public/favicon.svg (the hanko seal mark) into the PNG icon set and
// favicon.ico, and composes the default Open Graph image from an inline SVG
// template. Run once after changing the mark or the brand palette:
//
//   node scripts/generate-icons.mjs
//
// Requires the devDependencies sharp and png-to-ico. Note: SVG <text> is rendered
// with the fonts installed on the machine running this script; the 麺 glyph needs
// a system Japanese font (any macOS/Windows/Linux desktop with CJK fonts is fine).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

const PAPER = '#faf6ef';
const INK = '#1a1a18';
const INK_SOFT = '#4a463f';
const SEAL = '#b7321f';

const svg = readFileSync(join(PUBLIC, 'favicon.svg'));

// density scales the SVG's internal 64px viewBox up so large rasters stay crisp.
const render = (size) =>
  sharp(svg, { density: (72 * size) / 64 })
    .resize(size, size)
    .png();

// App icons (manifest + apple-touch). apple-touch is flattened onto the seal red so the
// rounded SVG corners don't leave transparent notches (iOS composites its own mask).
await render(192).toFile(join(PUBLIC, 'icon-192.png'));
await render(512).toFile(join(PUBLIC, 'icon-512.png'));
await sharp(svg, { density: (72 * 180) / 64 })
  .resize(180, 180)
  .flatten({ background: SEAL })
  .png()
  .toFile(join(PUBLIC, 'apple-touch-icon.png'));

// favicon.ico (16 + 32 px) — keeps BaseHead's sizes="32x32" link accurate. Passing the
// exact sizes stops png-to-ico from padding the ico with upscaled variants.
const png16 = await render(16).toBuffer();
const png32 = await render(32).toBuffer();
writeFileSync(join(PUBLIC, 'favicon.ico'), await pngToIco([png16, png32]));

// Default Open Graph image (1200x630): washi field, seal mark, bilingual wordmark, tagline.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect x="0" y="0" width="1200" height="10" fill="#d43d2a"/>
  <rect x="96" y="120" width="120" height="120" rx="18" fill="${SEAL}"/>
  <text x="156" y="184" text-anchor="middle" dominant-baseline="central"
        font-family="Hiragino Mincho ProN, Yu Mincho, Noto Serif JP, serif"
        font-size="76" fill="${PAPER}">麺</text>
  <text x="96" y="360" font-family="Shippori Mincho, Hiragino Mincho ProN, Georgia, serif"
        font-size="88" font-weight="600" letter-spacing="6" fill="${INK}">RAMEN GUIDE</text>
  <text x="96" y="420" font-family="Hiragino Mincho ProN, Yu Mincho, Noto Serif JP, serif"
        font-size="30" letter-spacing="8" fill="${INK_SOFT}">ラーメンガイド</text>
  <text x="96" y="500" font-family="-apple-system, Segoe UI, Helvetica, Arial, sans-serif"
        font-size="34" fill="${INK_SOFT}">A field guide to Japanese ramen — styles, regions, craft.</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile(join(PUBLIC, 'og-default.png'));

console.log(
  '✓ wrote icon-192.png, icon-512.png, apple-touch-icon.png, favicon.ico, og-default.png',
);
