# Image pipeline

How images get into blog posts. Two Node scripts (zero API keys) do the deterministic
work; the writer does the judgment (relevance, alt text, captions, placement). Full
step-by-step: `.claude/skills/source-images/SKILL.md`.

## Flow

```
fetch-image.mjs  →  (you pick a candidate)  →  optimize-image.mjs  →  paste markup  →  verify
   search                  judge                download + resize        into MDX
```

### 1. Search — `scripts/fetch-image.mjs`

```bash
node scripts/fetch-image.mjs "<subject>" [--source=openverse|wikimedia|all] [--limit=8] [--min-width=1200]
```

- Queries Openverse and/or Wikimedia Commons (no keys, Node 22 built-in `fetch`).
- Returns only commercially safe licenses: `cc0`, `pdm`, `by`, `by-sa`. NC/ND variants
  are never returned (this is a monetized site). SVG/GIF skipped; min width 1200px.
- Prints a JSON array of candidates (title, direct `url`, dimensions, license,
  creator, `foreign_landing_url`) to stdout.

### 2. Judge (human/agent, not the script)

Pick a candidate that actually shows the _specific_ subject, looks like a real photo
(no watermarks / collages / AI renders), and is ≥1200px. For heroes, open the landing
URL and confirm the license claim matches.

### 3. Optimize + record — `scripts/optimize-image.mjs`

```bash
node scripts/optimize-image.mjs --url=<candidate url> --slug=<kebab-slug> [--hero] \
  --license=<license> --license-version=<x.y> --license-url=<url> \
  --creator="<name>" --source-url=<landing url> --title="<title>"
```

- Downloads the URL (hard-fails on non-image responses so you fall back to the next
  candidate).
- `sharp` honors EXIF rotation, strips metadata, encodes WebP q80:
  - `--hero` → cover-crop to **1200x675** (16:9, matches `PostLayout` + og:image).
  - inline → resize to **max 1200px wide** (no enlargement).
- Writes `public/images/<slug>.webp`. Slug must be kebab-case, 3-6 descriptive words
  including the subject term (e.g. `shoyu-ramen-tare-soy-sauce`); never `image1`.
- Records attribution in `src/data/image-credits.json`, keyed by public path, keys
  sorted for stable diffs. **Never edit this file by hand.**
- Prints ready-to-paste markup (frontmatter lines for `--hero`, a `<Figure>` block
  for inline) with `TODO` placeholders for caption + alt.

### 4. Insert into the post

- **Hero:** paste `heroImage` + write a real `heroImageAlt` into frontmatter.
  `PostLayout.astro` renders it with `fetchpriority="high"` (no `loading`) as the LCP
  element, plus the credit line. Published posts fail validation if `heroImage` is set
  without `heroImageAlt`.
- **Inline:** `import Figure from '../../components/editorial/Figure.astro';` once near
  the top of the body, then paste each `<Figure>` block (blank lines around it, MDX
  requirement) next to the paragraph that explains the concept. Inline `<img>` uses
  `loading="lazy" decoding="async"`.
- All images carry explicit `width` + `height` (zero CLS). Do not change the
  loading attributes — they are set per role for Core Web Vitals.

### Content rules

- Alt text: 8-20 words describing what's visible; no "image of"/"photo of"; subject
  term once; no keyword stuffing.
- Captions: one sentence tying the image to the prose (teach, don't label). Keep the
  `source` attribution exactly as printed (CC BY / BY-SA legally require visible credit).
- No em dashes anywhere (the optimize script also scrubs them from recorded metadata).

### 5. Verify

```bash
pnpm run verify && pnpm run build && pnpm run audit
```

The audit's image gate requires ≥1 body `<img alt>` per published post. Eyeball in
`pnpm run dev`: hero + credit render, figures sit beside the relevant prose, no
leftover TODOs.

## Files

| Path                                    | Role                                                           |
| --------------------------------------- | -------------------------------------------------------------- |
| `scripts/fetch-image.mjs`               | Search CC-licensed images (step 1)                             |
| `scripts/optimize-image.mjs`            | Download, resize to WebP, record credit, print markup (step 2) |
| `.claude/skills/source-images/SKILL.md` | Full workflow + judgment rules (CLI-agnostic)                  |
| `src/components/editorial/Figure.astro` | Inline figure wrapper (caption + attribution)                  |
| `src/data/image-credits.json`           | Auto-generated attribution registry (never hand-edit)          |
| `public/images/<slug>.webp`             | Output images                                                  |
