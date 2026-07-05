#!/usr/bin/env node
// Image download + optimization for the content image pipeline (step 2 of 2).
//
// Takes a candidate chosen from scripts/fetch-image.mjs output, downloads it,
// optimizes it with sharp into public/images/<slug>.webp, records attribution
// in src/data/image-credits.json, and prints ready-to-paste markup (frontmatter
// lines for --hero, a <Figure> block for inline images).
//
//   node scripts/optimize-image.mjs --url=<direct-url> --slug=<kebab-slug> [--hero] \
//     --license=by-sa --license-url=<...> --creator="<name>" --source-url=<landing-url> \
//     [--creator-url=<...>] [--title="<...>"] [--license-version=4.0] [--force]
//
// Heroes are cover-cropped to 1200x675 (16:9, matches PostLayout's hardcoded
// dimensions and og:image best size); inline images are resized to <=1200px wide.
// Workflow doc: .claude/skills/source-images/SKILL.md

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES_DIR = join(ROOT, 'public', 'images');
const CREDITS_PATH = join(ROOT, 'src', 'data', 'image-credits.json');
const USER_AGENT = 'RamenGuide-ImagePipeline/1.0 (content sourcing; contact via site)';
const LICENSE_ALLOWLIST = new Set(['cc0', 'pdm', 'by', 'by-sa']);

const args = process.argv.slice(2);
const opt = (name) =>
  args
    .find((a) => a.startsWith(`--${name}=`))
    ?.split('=')
    .slice(1)
    .join('=');
const flag = (name) => args.includes(`--${name}`);

// Content rule: no em dashes in articles; scrub anything destined for MDX/captions.
const clean = (s = '') => s.replace(/—/g, '-').replace(/\s+/g, ' ').trim();

const url = opt('url');
const slug = opt('slug');
const license = (opt('license') ?? '').toLowerCase();
const isHero = flag('hero');

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

if (!url || !slug) {
  fail(
    'Usage: node scripts/optimize-image.mjs --url=<direct-url> --slug=<kebab-slug> [--hero] --license=by --creator="<name>" --source-url=<landing-url> [--license-url=..] [--creator-url=..] [--title=".."] [--license-version=..] [--force]',
  );
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  fail(`Slug "${slug}" must be kebab-case: lowercase letters, digits, single hyphens.`);
}
if (!LICENSE_ALLOWLIST.has(license)) {
  fail(
    `License "${license}" not in allowlist (${[...LICENSE_ALLOWLIST].join(', ')}). nc/nd variants are never OK on a monetized site.`,
  );
}

const outPath = join(IMAGES_DIR, `${slug}.webp`);
const publicPath = `/images/${slug}.webp`;
if (existsSync(outPath) && !flag('force')) {
  fail(`${publicPath} already exists; pass --force to overwrite or pick another slug.`);
}

// Download. Hard-fail on anything that is not a 200 image response so the caller
// falls back to the next candidate (stale Openverse URLs are common).
const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
if (!res.ok) fail(`Download failed: HTTP ${res.status} from ${new URL(url).host}`);
const contentType = res.headers.get('content-type') ?? '';
if (!contentType.startsWith('image/')) {
  fail(`Expected an image, got content-type "${contentType}". Pick another candidate.`);
}
const input = Buffer.from(await res.arrayBuffer());

// .rotate() honors EXIF orientation; sharp strips metadata by default.
let pipe = sharp(input).rotate();
pipe = isHero
  ? pipe.resize(1200, 675, { fit: 'cover' })
  : pipe.resize({ width: 1200, withoutEnlargement: true });
mkdirSync(IMAGES_DIR, { recursive: true });
const info = await pipe.webp({ quality: 80 }).toFile(outPath);

function formatLicense() {
  if (license === 'cc0') return 'CC0';
  if (license === 'pdm') return 'Public domain';
  const v = opt('license-version');
  return `CC ${license.toUpperCase()}${v ? ` ${v}` : ''}`;
}

// Record attribution, keyed by public path, keys sorted for stable diffs.
const credits = existsSync(CREDITS_PATH) ? JSON.parse(readFileSync(CREDITS_PATH, 'utf8')) : {};
credits[publicPath] = {
  title: clean(opt('title') ?? ''),
  creator: clean(opt('creator') ?? 'Unknown'),
  creator_url: opt('creator-url') ?? '',
  license: formatLicense(),
  license_url: opt('license-url') ?? '',
  source_url: opt('source-url') ?? '',
  retrieved: new Date().toISOString().slice(0, 10),
};
mkdirSync(dirname(CREDITS_PATH), { recursive: true });
writeFileSync(
  CREDITS_PATH,
  `${JSON.stringify(Object.fromEntries(Object.entries(credits).toSorted(([a], [b]) => a.localeCompare(b))), null, 2)}\n`,
);

const creator = clean(opt('creator') ?? 'Unknown');
const sourceUrl = opt('source-url') ?? '';
const via = sourceUrl.includes('wikimedia.org') ? 'Wikimedia Commons' : 'source';
const attribution = `${creator} via ${via} (${formatLicense()})`;

console.log(
  JSON.stringify(
    { file: publicPath, width: info.width, height: info.height, bytes: info.size },
    null,
    2,
  ),
);
console.log('');
if (isHero) {
  console.log('# Paste into the post frontmatter (write a real alt text):');
  console.log(`heroImage: '${publicPath}'`);
  console.log(`heroImageAlt: 'TODO: describe what is visible, 8-20 words'`);
} else {
  console.log('<!-- Paste where the concept is explained (write real caption + alt): -->');
  console.log(`<Figure
  caption="TODO: one sentence tying the image to the surrounding prose."
  source="${attribution}"
  sourceHref="${sourceUrl}"
>
  <img
    src="${publicPath}"
    alt="TODO: describe what is visible, 8-20 words"
    width="${info.width}"
    height="${info.height}"
    loading="lazy"
    decoding="async"
  />
</Figure>`);
}
