#!/usr/bin/env node
// On-page meta audit for Ramen Guide (Ahrefs Site Audit parity).
//
// Reads the production build in dist/ and checks every INDEXABLE page's <title> and
// <meta name="description"> against the Ahrefs length limits, then prints a scorecard
// and exits non-zero on any violation. Run AFTER `pnpm run build`.
//
// The build already hard-fails on the same limits via src/integrations/seo-meta-guard.mjs;
// this is the standalone, re-runnable scorecard. Limits/helpers come from src/lib/seo.mjs.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  extractMetaDescription,
  extractTitle,
  isHtmlPage,
  isNoindex,
  SEO_LIMITS,
  validateMeta,
} from '../src/lib/seo.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PASS = '✓';
const FAIL = '✗';

function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkHtml(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function main() {
  if (!existsSync(DIST)) {
    console.error(
      `${FAIL} dist/ not found — run \`pnpm run build\` first, then \`pnpm run audit:meta\`.`,
    );
    process.exit(1);
  }

  const files = walkHtml(DIST);
  const results = [];
  let skipped = 0;
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    if (!isHtmlPage(html) || isNoindex(html)) {
      skipped += 1;
      continue;
    }
    const issues = validateMeta({
      title: extractTitle(html),
      description: extractMetaDescription(html),
    });
    const rel = file.slice(DIST.length).replace(/index\.html$/, '') || '/';
    results.push({ rel, issues });
  }
  results.sort((a, b) => a.rel.localeCompare(b.rel));
  const failing = results.filter((r) => r.issues.length > 0);

  const lines = [];
  lines.push('');
  lines.push('  Ramen Guide — on-page meta audit (Ahrefs limits)');
  lines.push('  ' + '─'.repeat(54));
  lines.push(
    `  title ${SEO_LIMITS.titleMin}-${SEO_LIMITS.titleMax} · description ${SEO_LIMITS.descMin}-${SEO_LIMITS.descMax} · indexable pages only`,
  );
  lines.push('');
  lines.push(`  Scanned ${results.length} indexable page(s); ${skipped} noindex/asset skipped.`);
  if (failing.length === 0) {
    lines.push(`  ${PASS} all ${results.length} pages within limits`);
  } else {
    lines.push(`  ${FAIL} ${failing.length}/${results.length} page(s) failing:`);
    for (const r of failing) {
      lines.push(`      ${r.rel}`);
      for (const i of r.issues) lines.push(`        - ${i}`);
    }
  }
  lines.push('');

  console.log(lines.join('\n'));
  process.exit(failing.length > 0 ? 1 : 0);
}

main();
