# Ramen Guide

A static site gathering everything about Japanese ramen — styles, broths, regional bowls, ingredients, and where to eat. Forked from the `techfinanceblog` (Capital & Compute) template: same SEO/GEO/AdSense plumbing, ramen content.

**Stack:** Astro 7 (static) · Svelte 5 (islands, none yet) · Tailwind CSS v4 · MDX · pnpm · Cloudflare Pages-ready.

## Commands

```bash
pnpm install         # installs deps + lefthook git hooks
pnpm run dev         # astro dev → http://localhost:4321
pnpm run build       # static build to dist/ (fails if any page's title/description breaks SEO limits)
pnpm run preview     # serve the production build
pnpm run verify      # oxlint && oxfmt --check && astro check
pnpm run audit       # AdSense readiness scorecard; reads dist/, so build first
pnpm run audit:meta  # Ahrefs-parity title/description audit of dist/
pnpm run indexnow    # submit recently-changed URLs to IndexNow (needs real domain + key)
```

## What's wired in

- **SEO:** canonical URLs, full OG/Twitter meta (`src/components/BaseHead.astro`), JSON-LD (`Schema*.astro`), sitemap with git-derived lastmod, RSS, build-time meta-length guard (`src/integrations/seo-meta-guard.mjs`, title 30–60 / description 110–160 chars).
- **GEO:** `/llms.txt` (auto-generated post catalog), AI-crawler allows + `Content-Signal` in `/robots.txt`, Agent Skills index at `/.well-known/agent-skills/`, WebMCP `list_articles` tool.
- **AdSense:** account-level loader in `BaseHead.astro` + `/ads.txt`, both driven by `SITE.adsensePublisherId` (blank = both inert). Approval readiness scored by `pnpm run audit` (needs ≥15 quality posts — that's the content roadmap).
- **Content:** MDX posts in `src/content/blog/` with a Zod-validated frontmatter schema (`src/content.config.ts`). Copy `_template.mdx` to start a post. Editorial components in `src/components/editorial/`.
- **SEO skills:** 12 Claude Code skills vendored in `.claude/skills/` (superseo-skills set + native `geo-audit`) for the weekly content workflow — see [SKILLS.md](SKILLS.md).

## Placeholders to replace before launch

All site config is centralized in `src/consts.ts` (plus `site` in `astro.config.mjs`):

- [ ] Domain: `https://example.com` → real domain (`consts.ts`, `astro.config.mjs`, `public/.well-known/agent-skills/browse-catalog/SKILL.md`, `scripts/indexnow.mjs`)
- [ ] `contactEmail` → working inbox
- [ ] `googleSiteVerification` (GSC token), `googleAnalyticsId` (GA4), `microsoftClarityId`
- [ ] `adsensePublisherId` — set only when applying to AdSense (snippet must be live pre-review)
- [ ] Newsletter: create a Kit form, set `formAction`, flip `enabled: true`
- [x] ~~`public/og-default.png`, favicons, icons~~ — now generated from the hanko mark (`public/favicon.svg` + `node scripts/generate-icons.mjs`)
- [ ] IndexNow: generate a key file in `public/<key>.txt`
- [ ] The three stub posts are placeholders — replace with real articles (≥1000 words, ≥1 image with alt, ≥2 internal links, ≥1 tag)

## Known gaps (deliberate, from the template)

- No consent-management platform (CMP) / cookie banner — required for AdSense + GDPR before real monetized launch.
- No in-content ad-unit component (`<ins class="adsbygoogle">`) — only the account-level loader exists.
