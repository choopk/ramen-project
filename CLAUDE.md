# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Ramen Guide: a static site gathering everything about Japanese ramen (styles, broths, regional bowls, ingredients, shops). Astro 7 (static output) + Svelte 5 islands + Tailwind v4 + MDX, deployable to Cloudflare Pages with no adapter. Node ≥ 22.12, pnpm ≥ 11. Forked from the Capital & Compute template; all SEO/GEO/AdSense plumbing carried over.

This is a starter: branding is placeholder ("Ramen Guide" / `https://example.com` in `src/consts.ts` and `astro.config.mjs`), analytics/AdSense IDs are blank, and the three blog posts are stubs.

## Commercial mandate

The site targets organic traffic and ad-network monetization (AdSense first). The AdSense approval gate is fully specified in `scripts/audit-approval.mjs` (min 15 quality posts, trust pages, SEO plumbing) — run `pnpm run build && pnpm run audit` to see the scorecard. Content depth is the lever; the plumbing is done.

## Commands

```bash
pnpm run dev         # astro dev → http://localhost:4321
pnpm run build       # static build to dist/
pnpm run preview     # serve the production build
pnpm run verify      # oxlint && oxfmt --check && astro check (run before considering work done)
pnpm run audit       # AdSense readiness scorecard (reads dist/, build first)
pnpm run audit:meta  # title/description length audit of dist/
```

No unit test suite: "tests" = `pnpm run verify` + a successful build.

## Toolchain (oxc, not Prettier/ESLint)

`oxlint` + `oxfmt`; config in `.oxlintrc.json` / `.oxfmtrc.json`. Do not introduce Prettier or ESLint. oxfmt cannot format `.astro` files yet — they are hand-formatted and excluded from format scripts; this is accepted, not a TODO. Git hooks via lefthook (`lefthook.yml`): pre-commit lints/formats staged files; pre-push prints the audit scorecard (non-blocking).

## Architecture

- `src/consts.ts` — the single `SITE` config object (title, url, IDs). Everything brand- or domain-specific reads from here.
- `src/content/blog/*.mdx` — posts, validated by `src/content.config.ts` (Zod). `_template.mdx` documents frontmatter + audit gates (≥1000 words, ≥1 image with alt, ≥2 internal links, ≥1 tag). Underscore-prefixed files never load.
- **SEO limits are build-enforced:** title 30–60 chars, description 110–160 (`src/lib/seo.mjs`). Violations fail the build via `src/integrations/seo-meta-guard.mjs` and fail frontmatter validation on published (draft:false) posts.
- `src/components/BaseHead.astro` — the single `<head>` builder: meta, OG, canonical, GA4/Clarity/AdSense loaders (all gated on PROD + ID set + production hostname), WebMCP tool.
- Routes: `src/pages/[...page].astro` (paginated index), `src/pages/blog/[...slug].astro` (post renderer → `PostLayout`), trust pages, and endpoints `robots.txt.ts`, `llms.txt.ts`, `ads.txt.ts`, `rss.xml.js`.
- `src/integrations/agent-skills-index.mjs` emits `/.well-known/agent-skills/index.json` from the SKILL.md files in `public/.well-known/agent-skills/`.
- Sitemap lastmod comes from git history (`src/lib/lastmod.mjs`) — shallow clones degrade it (warned at build).
- Styling: Tailwind v4, theme in `src/styles/global.css` `@theme` block (no tailwind.config). Warm-washi palette (paper `#faf6ef`, ink `#1a1a18`, vermillion accent `#d43d2a` — decorative only; text links use `--color-accent-ink`). Headings use self-hosted Shippori Mincho (latin subset via @fontsource; kana/kanji ornaments fall back to system mincho). Ornament utilities: `.washi-rule`, `.washi-divider`, `.hanko`, `.jp-accent`. Bilingual UI accents are decorative: `<span lang="ja" aria-hidden="true" class="jp-accent">`. shadcn-svelte wired (`components.json`), only Button vendored.
- Icons/OG are generated: edit `public/favicon.svg` then run `node scripts/generate-icons.mjs` (sharp + png-to-ico) to regenerate PNG icons, favicon.ico, and og-default.png.

## Publishing gates

- New post: copy `_template.mdx`, keep `draft: true` until content passes the audit gates, then flip to `draft: false`.
- Before launch, work the placeholder checklist in README.md (domain, IDs, OG image, newsletter, IndexNow key).
- A CMP/consent banner and in-content ad-unit components do not exist yet; both are required before real monetized launch.
