#!/usr/bin/env node
// CC-licensed image search for the content image pipeline (step 1 of 2).
//
// Queries Openverse and/or Wikimedia Commons (no API keys) and prints a JSON
// array of candidates to stdout. A human or agent judges relevance, then feeds
// the chosen candidate's fields to scripts/optimize-image.mjs. Only commercially
// safe licenses are returned (cc0, pdm, by, by-sa; never nc/nd variants).
//
//   node scripts/fetch-image.mjs "shoyu ramen" [--source=openverse|wikimedia|all]
//     [--limit=8] [--min-width=1200]
//
// Zero dependencies (Node 22 built-in fetch). Workflow doc:
// .claude/skills/source-images/SKILL.md

const LICENSE_ALLOWLIST = new Set(['cc0', 'pdm', 'by', 'by-sa']);
const SKIP_FILETYPES = new Set(['svg', 'gif']);
// Wikimedia rejects requests with a default/blank User-Agent.
const USER_AGENT = 'RamenGuide-ImagePipeline/1.0 (content sourcing; contact via site)';

const args = process.argv.slice(2);
const query = args.find((a) => !a.startsWith('--'));
const opt = (name, fallback) =>
  args
    .find((a) => a.startsWith(`--${name}=`))
    ?.split('=')
    .slice(1)
    .join('=') ?? fallback;

if (!query) {
  console.error(
    'Usage: node scripts/fetch-image.mjs "<query>" [--source=openverse|wikimedia|all] [--limit=8] [--min-width=1200]',
  );
  process.exit(1);
}

const source = opt('source', 'all');
const limit = Number(opt('limit', '8'));
const minWidth = Number(opt('min-width', '1200'));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} from ${new URL(url).host}${res.status === 429 ? ' (rate limited; wait before retrying)' : ''}`,
    );
  }
  return res.json();
}

function keepCandidate(c) {
  return (
    c.url &&
    c.width >= minWidth &&
    !SKIP_FILETYPES.has(c.filetype) &&
    LICENSE_ALLOWLIST.has(c.license)
  );
}

async function searchOpenverse() {
  const u = new URL('https://api.openverse.org/v1/images/');
  u.searchParams.set('q', query);
  u.searchParams.set('license', [...LICENSE_ALLOWLIST].join(','));
  u.searchParams.set('size', 'large');
  u.searchParams.set('page_size', String(Math.min(limit * 2, 40)));
  const data = await getJson(u);
  return (data.results ?? [])
    .map((r) => ({
      source: 'openverse',
      id: r.id,
      title: r.title ?? '',
      url: r.url,
      width: r.width ?? 0,
      height: r.height ?? 0,
      license: r.license,
      license_version: r.license_version ?? '',
      license_url: r.license_url ?? '',
      creator: r.creator ?? 'Unknown',
      creator_url: r.creator_url ?? '',
      foreign_landing_url: r.foreign_landing_url ?? '',
      filetype: r.filetype ?? (r.url?.split('.').pop() ?? '').toLowerCase(),
    }))
    .filter(keepCandidate)
    .slice(0, limit);
}

// Commons extmetadata license short names look like "CC BY-SA 4.0", "CC0",
// "Public domain". Normalize to the allowlist vocabulary or return null.
function normalizeCommonsLicense(shortName = '') {
  const s = shortName.toLowerCase();
  if (s.includes('nc') || s.includes('nd')) return null;
  if (s.startsWith('cc0')) return { license: 'cc0', version: '1.0' };
  if (s.includes('public domain') || s === 'pdm') return { license: 'pdm', version: '' };
  const m = s.match(/cc by(-sa)? ?([\d.]*)/);
  if (m) return { license: m[1] ? 'by-sa' : 'by', version: m[2] ?? '' };
  return null;
}

const stripHtml = (s = '') =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

async function searchWikimedia() {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.searchParams.set('action', 'query');
  u.searchParams.set('format', 'json');
  u.searchParams.set('generator', 'search');
  u.searchParams.set('gsrsearch', query);
  u.searchParams.set('gsrnamespace', '6'); // File: namespace
  u.searchParams.set('gsrlimit', String(Math.min(limit * 3, 50)));
  u.searchParams.set('prop', 'imageinfo');
  u.searchParams.set('iiprop', 'url|size|extmetadata');
  u.searchParams.set('iiurlwidth', '1600'); // scaled thumb; originals can be huge
  const data = await getJson(u);
  const pages = Object.values(data.query?.pages ?? {});
  return pages
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata ?? {};
      const lic = normalizeCommonsLicense(meta.LicenseShortName?.value);
      if (!lic) return null;
      const ext = (info.url?.split('.').pop() ?? '').toLowerCase();
      return {
        source: 'wikimedia',
        id: String(p.pageid),
        title: stripHtml(meta.ObjectName?.value) || p.title.replace(/^File:/, ''),
        // thumburl is the 1600w rendition; falls back to the original for small files.
        url: info.thumburl ?? info.url,
        width: Math.min(info.width ?? 0, 1600),
        height: info.thumbheight ?? info.height ?? 0,
        license: lic.license,
        license_version: lic.version,
        license_url: meta.LicenseUrl?.value ?? '',
        creator: stripHtml(meta.Artist?.value) || 'Unknown',
        creator_url: '',
        foreign_landing_url: info.descriptionurl ?? '',
        filetype: ext,
        original_width: info.width ?? 0,
      };
    })
    .filter(Boolean)
    .filter((c) => keepCandidate({ ...c, width: c.original_width }))
    .slice(0, limit);
}

const jobs = [];
if (source === 'openverse' || source === 'all') jobs.push(['openverse', searchOpenverse]);
if (source === 'wikimedia' || source === 'all') jobs.push(['wikimedia', searchWikimedia]);
if (jobs.length === 0) {
  console.error(`Unknown --source=${source} (use openverse, wikimedia, or all)`);
  process.exit(1);
}

const settled = await Promise.allSettled(jobs.map(([, fn]) => fn()));
const candidates = [];
let failures = 0;
settled.forEach((r, i) => {
  if (r.status === 'fulfilled') {
    candidates.push(...r.value);
  } else {
    failures += 1;
    console.error(`✗ ${jobs[i][0]} search failed: ${r.reason.message}`);
  }
});

if (failures === jobs.length) process.exit(1);
if (candidates.length === 0) {
  console.error(`No candidates ≥${minWidth}px with allowed licenses for "${query}".`);
}
console.log(JSON.stringify(candidates, null, 2));
