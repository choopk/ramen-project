// Single source of truth for on-page SEO meta limits (Ahrefs Site Audit parity).
//
//   Title:       30-60 chars.  Ahrefs flags > 60 as "Title too long"; 30 is a
//                              best-practice floor for the soft "Title too short"
//                              warning (Ahrefs publishes no hard number for it).
//   Description: 110-160 chars. Ahrefs flags < 110 "too short" and > 160 "too long".
//
// Imported by the content schema (src/content.config.ts), the build-time guard
// (src/integrations/seo-meta-guard.mjs), and the standalone audit (scripts/audit-meta.mjs)
// so all three agree. Plain ESM (.mjs), no node:fs, so it is safe to import anywhere.

export const SEO_LIMITS = {
  titleMin: 30,
  titleMax: 60,
  descMin: 110,
  descMax: 160,
};

// Decode the entities Astro emits in <title>/<meta> so the measured length matches
// the human-visible character count (a single `&` ships as `&amp;`, etc.). `&amp;`
// is decoded last so an already-encoded entity is not double-decoded.
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
}

export function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : '';
}

export function extractMetaDescription(html) {
  // Backreference the opening quote so an apostrophe inside a double-quoted value
  // (e.g. content="...China's GLM...") does not prematurely end the match.
  const m = html.match(/<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i);
  return m ? decodeEntities(m[2]).trim() : '';
}

// A real rendered page always carries a <title> (via BaseHead); title-less .html files in
// dist are static assets (e.g. the Google Search Console verification file), not pages, so
// the meta guard skips them rather than flagging their empty title/description.
export function isHtmlPage(html) {
  return /<title[\s>]/i.test(html);
}

// True when any robots meta tag carries a noindex directive. Such pages are excluded
// from Google's index, so Ahrefs does not flag their title/description and neither do we.
export function isNoindex(html) {
  const metas = html.match(/<meta\s+name=["']robots["'][^>]*>/gi) ?? [];
  return metas.some((tag) => /content=["'][^"']*\bnoindex\b/i.test(tag));
}

// Validate one page's title + description against SEO_LIMITS. Returns an array of
// human-readable violation strings; an empty array means the page is within limits.
export function validateMeta({ title, description }) {
  const issues = [];
  const t = (title ?? '').length;
  const d = (description ?? '').length;
  if (t < SEO_LIMITS.titleMin) issues.push(`title ${t} chars (min ${SEO_LIMITS.titleMin})`);
  else if (t > SEO_LIMITS.titleMax) issues.push(`title ${t} chars (max ${SEO_LIMITS.titleMax})`);
  if (d < SEO_LIMITS.descMin) issues.push(`description ${d} chars (min ${SEO_LIMITS.descMin})`);
  else if (d > SEO_LIMITS.descMax)
    issues.push(`description ${d} chars (max ${SEO_LIMITS.descMax})`);
  return issues;
}
