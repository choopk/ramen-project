#!/usr/bin/env node
// Ad-network (AdSense) readiness audit for Ramen Guide.
//
// Reads the production build in dist/ and scores it against the AdSense approval gate:
// required trust pages, content volume, per-post quality, and SEO plumbing. Prints a
// scorecard and exits non-zero until every hard gate passes. Run AFTER `pnpm run build`.
//
// Zero dependencies — plain Node + the filesystem. See plan: ad-network approval harness.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SEO_LIMITS } from '../src/lib/seo.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// --- Gate thresholds (mirror src/content/blog/_template.mdx) ---
const MIN_POSTS = 15;
const MIN_WORDS = 1000;
// Description band is shared with the Ahrefs meta guard (src/lib/seo.mjs) so a post
// can't pass this audit but fail the build's title/description check, or vice versa.
const DESC_MIN = SEO_LIMITS.descMin;
const DESC_MAX = SEO_LIMITS.descMax;
const MIN_IMAGES = 1;
const MIN_INTERNAL_LINKS = 2;
const MIN_TAGS = 1;

const TRUST_PAGES = [
  'about',
  'contact',
  'privacy-policy',
  'terms',
  'editorial-standards',
  'disclaimer',
];

const PASS = '✓';
const FAIL = '✗';

// --- Small HTML helpers (no parser dependency) ---
function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function extractArticle(html) {
  const m = html.match(/<article[\s\S]*?<\/article>/i);
  return m ? m[0] : '';
}

function metaDescription(html) {
  // Backreference the opening quote (as in src/lib/seo.mjs) so an apostrophe inside a
  // double-quoted value (e.g. content="...Japan's regions...") doesn't end the match early.
  const m = html.match(/<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i);
  return m ? m[2].trim() : '';
}

function imagesWithAlt(html) {
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  return imgs.filter((tag) => {
    const alt = tag.match(/\balt=["']([\s\S]*?)["']/i);
    return alt && alt[1].trim().length > 0;
  }).length;
}

// Inline SVG charts (built from components) carry their own accessible name via
// role="img" + a non-empty aria-label/aria-labelledby. They are real visual content, so they
// count toward the image gate alongside <img> tags.
function accessibleSvgs(html) {
  const svgs = html.match(/<svg\b[^>]*>/gi) ?? [];
  return svgs.filter((tag) => {
    const isImg = /\brole=["']img["']/i.test(tag);
    const named = /\baria-label(?:ledby)?=["']\s*\S[\s\S]*?["']/i.test(tag);
    return isImg && named;
  }).length;
}

function internalLinks(html) {
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map((m) => m[1]);
  const internal = new Set();
  for (const href of hrefs) {
    if (href.startsWith('mailto:') || href.startsWith('#')) continue;
    if (href.startsWith('//')) continue;
    if (href.startsWith('/')) internal.add(href.split('#')[0]);
    else if (href.includes('example.com')) internal.add(href.split('#')[0]);
  }
  return internal.size;
}

function countTags(html) {
  return (html.match(/data-tag=["']/gi) ?? []).length;
}

// --- Collectors ---
function listPostDirs() {
  const blogDir = join(DIST, 'blog');
  if (!existsSync(blogDir)) return [];
  return readdirSync(blogDir)
    .filter((name) => {
      const p = join(blogDir, name);
      return statSync(p).isDirectory() && existsSync(join(p, 'index.html'));
    })
    .map((name) => ({ slug: name, file: join(blogDir, name, 'index.html') }));
}

function auditPost(post) {
  const html = readFileSync(post.file, 'utf8');
  const article = extractArticle(html);
  const words = wordCount(stripTags(article));
  const desc = metaDescription(html);
  const failures = [];
  if (words < MIN_WORDS) failures.push(`words ${words} (<${MIN_WORDS})`);
  if (desc.length < DESC_MIN || desc.length > DESC_MAX)
    failures.push(`description ${desc.length} chars (need ${DESC_MIN}-${DESC_MAX})`);
  const imgs = imagesWithAlt(article) + accessibleSvgs(article);
  if (imgs < MIN_IMAGES) failures.push(`${imgs} images w/ alt (<${MIN_IMAGES})`);
  const links = internalLinks(article);
  if (links < MIN_INTERNAL_LINKS) failures.push(`${links} internal links (<${MIN_INTERNAL_LINKS})`);
  const tags = countTags(html);
  if (tags < MIN_TAGS) failures.push(`${tags} tags (<${MIN_TAGS})`);
  return { slug: post.slug, words, failures };
}

function gscConfigured() {
  try {
    const consts = readFileSync(join(ROOT, 'src', 'consts.ts'), 'utf8');
    const m = consts.match(/googleSiteVerification:\s*['"]([^'"]*)['"]/);
    return Boolean(m && m[1].trim());
  } catch {
    return false;
  }
}

// --- Run ---
function main() {
  const lines = [];
  let hardFail = false;
  const mark = (ok) => (ok ? PASS : FAIL);

  if (!existsSync(DIST)) {
    console.error(
      `${FAIL} dist/ not found — run \`pnpm run build\` first, then \`pnpm run audit\`.`,
    );
    process.exit(1);
  }

  lines.push('');
  lines.push('  Ramen Guide — AdSense readiness audit');
  lines.push('  ' + '─'.repeat(48));
  lines.push('');

  // Site-level gates
  lines.push('  SITE GATES');

  const trustPresent = TRUST_PAGES.filter((p) => existsSync(join(DIST, p, 'index.html')));
  const trustOk = trustPresent.length === TRUST_PAGES.length;
  hardFail ||= !trustOk;
  lines.push(`  ${mark(trustOk)} Trust pages: ${trustPresent.length}/${TRUST_PAGES.length}`);
  if (!trustOk) {
    const missing = TRUST_PAGES.filter((p) => !trustPresent.includes(p));
    lines.push(`      missing: ${missing.join(', ')}`);
  }

  const posts = listPostDirs();
  const postsOk = posts.length >= MIN_POSTS;
  hardFail ||= !postsOk;
  lines.push(`  ${mark(postsOk)} Posts: ${posts.length}/${MIN_POSTS}`);

  const seo = [
    ['sitemap-index.xml', existsSync(join(DIST, 'sitemap-index.xml'))],
    ['robots.txt', existsSync(join(DIST, 'robots.txt'))],
    ['rss.xml', existsSync(join(DIST, 'rss.xml'))],
    ['googleSiteVerification', gscConfigured()],
  ];
  for (const [name, ok] of seo) {
    hardFail ||= !ok;
    lines.push(`  ${mark(ok)} ${name}`);
  }

  // Footer links to all trust pages (check the homepage build)
  let footerOk = false;
  const indexFile = join(DIST, 'index.html');
  if (existsSync(indexFile)) {
    const idx = readFileSync(indexFile, 'utf8');
    footerOk = TRUST_PAGES.every((p) => idx.includes(`/${p}/`));
  }
  hardFail ||= !footerOk;
  lines.push(`  ${mark(footerOk)} Footer links to all trust pages`);

  // Per-post gates
  lines.push('');
  lines.push('  POST GATES (each post must pass all checks)');
  const audited = posts.map(auditPost);
  const failingPosts = audited.filter((p) => p.failures.length > 0);
  hardFail ||= failingPosts.length > 0;
  if (posts.length === 0) {
    lines.push('  — no published posts found in dist/blog');
  } else if (failingPosts.length === 0) {
    lines.push(`  ${PASS} all ${audited.length} posts pass`);
  } else {
    lines.push(`  ${FAIL} ${failingPosts.length}/${audited.length} posts failing:`);
    for (const p of failingPosts) {
      lines.push(`      ${p.slug}: ${p.failures.join(', ')}`);
    }
  }

  // Verdict
  lines.push('');
  lines.push('  ' + '─'.repeat(48));
  if (hardFail) {
    const siteGapTrust = trustOk ? 0 : 1;
    const siteGapPosts = postsOk ? 0 : MIN_POSTS - posts.length;
    lines.push(`  VERDICT: NOT READY`);
    if (siteGapPosts > 0) lines.push(`  → write ${siteGapPosts} more qualifying post(s)`);
    if (siteGapTrust > 0) lines.push(`  → add the missing trust page(s) above`);
    if (failingPosts.length > 0)
      lines.push(`  → fix the ${failingPosts.length} failing post(s) above`);
  } else {
    lines.push(`  VERDICT: READY TO APPLY ✓`);
  }

  // AdSense wiring checklist (informational, never gated). The connection snippet is a
  // PRE-review step: Google won't review the site until the snippet is live on it.
  lines.push('');
  lines.push('  BEFORE YOU APPLY (the snippet must be live for Google to review):');
  lines.push('  • Set SITE.adsensePublisherId in src/consts.ts to your ca-pub-… ID, then deploy.');
  lines.push('    This emits the AdSense loader in BaseHead.astro and the /ads.txt line.');
  lines.push('  AFTER ADSENSE ACCEPTS YOU:');
  lines.push('  • Add a feature-flagged <AdSlot> component for in-article / header placements.');
  lines.push('');

  console.log(lines.join('\n'));
  process.exit(hardFail ? 1 : 0);
}

main();
