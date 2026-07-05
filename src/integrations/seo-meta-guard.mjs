// Build-time guard: fail `astro build` (and therefore the Cloudflare deploy) if any
// INDEXABLE page ships a title or meta description outside the Ahrefs limits. Runs in
// `astro:build:done` over the emitted dist HTML, so it checks exactly what crawlers see.
// Drafts never reach the production build, so they are never scanned.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  extractMetaDescription,
  extractTitle,
  isHtmlPage,
  isNoindex,
  SEO_LIMITS,
  validateMeta,
} from '../lib/seo.mjs';

function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkHtml(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

export default function seoMetaGuard() {
  return {
    name: 'seo-meta-guard',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = walkHtml(root);
        const violations = [];
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
          if (issues.length > 0) {
            const rel = file.slice(root.length).replace(/index\.html$/, '') || '/';
            violations.push(`${rel}  ${issues.join('; ')}`);
          }
        }

        if (violations.length > 0) {
          logger.error(
            `${violations.length} indexable page(s) outside Ahrefs limits ` +
              `(title ${SEO_LIMITS.titleMin}-${SEO_LIMITS.titleMax}, ` +
              `description ${SEO_LIMITS.descMin}-${SEO_LIMITS.descMax}):`,
          );
          for (const v of violations) logger.error(`  ${v}`);
          throw new Error(
            `seo-meta-guard: ${violations.length} page(s) exceed Ahrefs title/description limits (see above).`,
          );
        }

        logger.info(
          `all ${files.length - skipped} indexable page(s) within Ahrefs title/description limits ` +
            `(${skipped} noindex/asset skipped)`,
        );
      },
    },
  };
}
