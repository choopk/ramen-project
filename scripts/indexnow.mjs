#!/usr/bin/env node
// IndexNow submitter for Ramen Guide.
//
// Notifies the IndexNow network (Bing, Yandex, Seznam, Naver; Google does not use it) that
// URLs have changed, so they get crawled sooner. The GEO payoff is Bing's index feeding
// ChatGPT Search and Microsoft Copilot. Cloudflare Crawler Hints already does this
// automatically and heuristically (see docs/indexnow.md); this script is the deterministic
// path: it submits exactly the URLs you choose, every time.
//
// The key is auto-discovered from the UTF-8 key file in public/ (public/<key>.txt, whose
// contents are the key). Drop a new key file in to rotate; nothing else changes.
//
// URL source is the LIVE production sitemap, so only deployed, non-draft, canonical
// (trailing-slash) URLs are ever submitted. Run this AFTER a deploy is live.
//
// Usage:
//   node scripts/indexnow.mjs                 submit URLs changed in the last 7 days (per sitemap lastmod)
//   node scripts/indexnow.mjs --days=30       widen the change window
//   node scripts/indexnow.mjs --all           submit every URL in the sitemap
//   node scripts/indexnow.mjs <url> [<url>…]  submit explicit URLs (must belong to the host)
//   node scripts/indexnow.mjs --dry-run …     print what would be submitted, send nothing
//
// pnpm run indexnow [-- <flags>]

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Mirrors SITE.url in src/consts.ts. Single-domain site; kept here so this plain-Node script
// needn't import the TypeScript consts module.
const SITE_URL = 'https://example.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const DEFAULT_DAYS = 7;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const PASS = '✓';
const FAIL = '✗';

// IndexNow keys are 8–128 hex characters; the key file is named <key>.txt.
const KEY_FILE_RE = /^[a-f0-9]{8,128}\.txt$/i;

function die(msg) {
  console.error(`${FAIL} ${msg}`);
  process.exit(1);
}

// Find and validate the single IndexNow key file in public/. Returns { key, keyLocation }.
function discoverKey() {
  const candidates = readdirSync(PUBLIC).filter((n) => KEY_FILE_RE.test(n));
  if (candidates.length === 0) {
    die('no IndexNow key file (public/<key>.txt) found. Add the key file Bing gave you.');
  }
  if (candidates.length > 1) {
    die(`multiple key files in public/ (${candidates.join(', ')}); keep exactly one.`);
  }
  const file = candidates[0];
  const expected = file.replace(/\.txt$/i, '');
  const contents = readFileSync(join(PUBLIC, file), 'utf8').trim();
  if (contents !== expected) {
    die(`key file ${file} must contain exactly "${expected}" (its filename without .txt).`);
  }
  return { key: expected, keyLocation: `${SITE_URL}/${file}` };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'ramen-guide-indexnow' } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  return res.text();
}

// Minimal sitemap XML parsing (no dependency). Pulls <loc> (and optional <lastmod>) from each
// <url> entry, and child sitemap <loc>s from a <sitemapindex>.
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}>\\s*([\\s\\S]*?)\\s*</${name}>`, 'i'));
  return m ? m[1].trim() : null;
}

function blocks(xml, name) {
  return xml.match(new RegExp(`<${name}>[\\s\\S]*?</${name}>`, 'gi')) ?? [];
}

// Walk the live sitemap (index or single urlset) into [{ loc, lastmod }].
async function collectSitemapEntries() {
  const indexUrl = `${SITE_URL}/sitemap-index.xml`;
  let xml;
  try {
    xml = await fetchText(indexUrl);
  } catch {
    // Some builds emit only sitemap-0.xml with no index; fall back to it.
    xml = await fetchText(`${SITE_URL}/sitemap-0.xml`);
  }

  const childUrls = /<sitemapindex/i.test(xml)
    ? blocks(xml, 'sitemap')
        .map((b) => tag(b, 'loc'))
        .filter(Boolean)
    : [indexUrl];

  const entries = [];
  for (const child of childUrls) {
    const childXml = child === indexUrl ? xml : await fetchText(child);
    for (const b of blocks(childXml, 'url')) {
      const loc = tag(b, 'loc');
      if (loc) entries.push({ loc, lastmod: tag(b, 'lastmod') });
    }
  }
  return entries;
}

function parseArgs(argv) {
  const opts = { all: false, dryRun: false, days: DEFAULT_DAYS, urls: [] };
  for (const arg of argv) {
    if (arg === '--all') opts.all = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg.startsWith('--days=')) opts.days = Number(arg.slice('--days='.length));
    else if (arg.startsWith('http://') || arg.startsWith('https://')) opts.urls.push(arg);
    else die(`unrecognized argument: ${arg}`);
  }
  if (!Number.isFinite(opts.days) || opts.days <= 0) die('--days must be a positive number.');
  return opts;
}

// Decide the URL list from args + sitemap. Returns { urlList, why }.
async function resolveUrls(opts) {
  const host = new URL(SITE_URL).host;

  if (opts.urls.length > 0) {
    const foreign = opts.urls.filter((u) => new URL(u).host !== host);
    if (foreign.length > 0) {
      die(`these URLs are not on ${host}: ${foreign.join(', ')}`);
    }
    return { urlList: opts.urls, why: `${opts.urls.length} explicit URL(s)` };
  }

  const entries = await collectSitemapEntries();
  if (opts.all) {
    return { urlList: entries.map((e) => e.loc), why: `all ${entries.length} sitemap URL(s)` };
  }

  const cutoff = Date.now() - opts.days * 24 * 60 * 60 * 1000;
  const fresh = entries.filter((e) => {
    if (!e.lastmod) return false;
    const t = Date.parse(e.lastmod);
    return Number.isFinite(t) && t >= cutoff;
  });
  return {
    urlList: fresh.map((e) => e.loc),
    why: `${fresh.length} URL(s) changed in the last ${opts.days} day(s)`,
  };
}

async function submit({ key, keyLocation }, urlList) {
  const host = new URL(SITE_URL).host;
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
  });
  return { status: res.status, body: (await res.text()).trim() };
}

const STATUS_HINT = {
  200: 'submitted successfully',
  202: 'accepted (key verification pending)',
  400: 'bad request: invalid format',
  403: 'forbidden: key not valid (file missing, or key not in the file)',
  422: "unprocessable: URLs don't belong to the host, or the key doesn't match",
  429: 'too many requests: rate-limited as potential spam, retry later',
};

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const credentials = discoverKey();
  const { urlList, why } = await resolveUrls(opts);

  console.log('');
  console.log('  Ramen Guide — IndexNow submission');
  console.log('  ' + '─'.repeat(54));
  console.log(`  key      ${credentials.keyLocation}`);
  console.log(`  endpoint ${ENDPOINT}`);
  console.log(`  scope    ${why}`);

  if (urlList.length === 0) {
    console.log(`  ${PASS} nothing to submit.`);
    console.log('');
    return;
  }

  for (const u of urlList) console.log(`           • ${u}`);

  if (opts.dryRun) {
    console.log(`  ${PASS} dry run: ${urlList.length} URL(s) would be submitted, sent nothing.`);
    console.log('');
    return;
  }

  const { status, body } = await submit(credentials, urlList);
  const hint = STATUS_HINT[status] ?? 'unexpected response';
  const ok = status === 200 || status === 202;
  console.log('');
  console.log(`  ${ok ? PASS : FAIL} ${status} — ${hint}`);
  if (body) console.log(`     response: ${body}`);
  console.log('');
  process.exit(ok ? 0 : 1);
}

main().catch((err) => die(err?.message ?? String(err)));
