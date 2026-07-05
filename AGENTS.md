# AGENTS.md

Canonical project instructions for ANY agentic CLI/runtime (Claude Code, OpenCode,
Codex, Gemini, ...). Claude Code loads this via the `@AGENTS.md` import in CLAUDE.md;
OpenCode reads it natively (AGENTS.md wins over CLAUDE.md there); headless loop runs
get the protocol passed verbatim, so nothing here is load-bearing for the loop.

## What this is

Ramen Guide: a static site gathering everything about Japanese ramen (styles, broths, regional bowls, ingredients, shops). Astro 7 (static output) + Svelte 5 islands + Tailwind v4 + MDX, deployable to Cloudflare Pages with no adapter. Node ≥ 22.12, pnpm ≥ 11. Forked from the Capital & Compute template; all SEO/GEO/AdSense plumbing carried over.

This is a starter: branding is placeholder ("Ramen Guide" / `https://example.com` in `src/consts.ts` and `astro.config.mjs`), analytics/AdSense IDs are blank, and the three blog posts are stubs.

## Commercial mandate

The site targets organic traffic and ad-network monetization (AdSense first). The AdSense approval gate is fully specified in `scripts/audit-approval.mjs` (min 15 quality posts, trust pages, SEO plumbing) — run `pnpm run build && pnpm run audit` to see the scorecard. Content depth is the lever; the plumbing is done.

## Content rules

- **NEVER use em dashes (—) in articles.** Use commas, colons, semicolons, or parentheses instead. This is a hard rule for all `src/content/blog/*.mdx` files.
- **Images:** every post gets a hero (frontmatter `heroImage` + required `heroImageAlt`) plus 2-4 inline `<Figure>` blocks at concept/ingredient explanations. Source, optimize, and name them via the workflow in `.claude/skills/source-images/SKILL.md` (backed by `scripts/fetch-image.mjs` + `scripts/optimize-image.mjs`; CC-safe licenses only, visible attribution). Credits are recorded in `src/data/image-credits.json`; never edit it by hand.

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

## Living memory & agent loop

Full guide: `memory/README.md`.

- `memory/` is the cross-CLI living memory: `MEMORY.md` (repo lessons, ≤2,200 chars), `USER.md` (operator preferences, ≤1,400 chars), `TASKS.md` (content task queue), `JOURNAL.md` (append-only iteration log), `PROMPT.md` (loop protocol — single source of truth).
- Every memory entry carries a provenance tag: `[human|agent · YYYY-MM-DD]` in MEMORY.md, `[stated|inferred · YYYY-MM-DD]` in USER.md. Only human/stated entries are hard constraints; agent/inferred ones may be revised or dropped at consolidation.
- **Frozen snapshot rule:** read `MEMORY.md` + `USER.md` ONCE at session start; write back only at an end-of-work checkpoint, never mid-session. This keeps the prompt-cache prefix byte-stable (cache reads cost 0.1× — mutating memory mid-session forfeits that).
- After writing to memory files, run `scripts/memory-lint.sh` (caps + injection-pattern scan). Consolidation is where poisoned memory becomes permanent, so the bar to enter MEMORY.md is high.
- Autonomous content production: `scripts/agent-loop.sh [claude|opencode|codex|gemini] [--iterations N] [--commit]` runs one task per iteration per `memory/PROMPT.md`. Halt with `touch memory/STOP`. The loop never flips `draft: false` on new posts — humans publish via the `[H]` queue in `TASKS.md`.

## Publishing gates

- New post: copy `_template.mdx`, keep `draft: true` until content passes the audit gates, then flip to `draft: false`.
- Before launch, work the placeholder checklist in README.md (domain, IDs, OG image, newsletter, IndexNow key).
- A CMP/consent banner and in-content ad-unit components do not exist yet; both are required before real monetized launch.

## Cross-tool notes

- SEO skills are plain markdown in `.claude/skills/<name>/SKILL.md` — any CLI can follow them directly; no Claude runtime required. The image pipeline (`source-images` skill + the two `scripts/*-image.mjs` scripts) is likewise CLI-agnostic: plain markdown + Node scripts, no API keys.
- OpenCode: `opencode.json` force-loads `memory/MEMORY.md` + `memory/USER.md` via its `instructions` array (OpenCode does not follow `@path` imports). `memory/PROMPT.md` is deliberately NOT auto-loaded — interactive sessions are not loop iterations.
- Gemini CLI reads GEMINI.md by default; for interactive Gemini here, add `.gemini/settings.json` with `{"contextFileName": ["AGENTS.md"]}`. Headless loop runs don't need it.
