---
name: source-images
description: Find CC-licensed images online, optimize and name them, and insert them into blog posts with attribution. Use when adding a hero image or inline figures to a post in src/content/blog/. Plain markdown workflow; works from any agentic CLI (Claude Code, OpenCode, etc.).
---

# Source images for a post

Add a hero image plus inline figures at the passages where concepts, ingredients, or
techniques are explained, so readers get a visual cue instead of unbroken text. The
scripts do the deterministic work (search, download, optimize, name, record credits);
YOU do the judgment (picking relevant candidates, writing alt text and captions,
placing figures in prose).

## Workflow

### 1. Pick subjects

Read the post. Choose:

- One **hero** subject: the post's main dish/topic as a photograph.
- 2 to 4 **inline** subjects: concrete concepts or ingredients the prose explains
  (e.g. "kansui noodles", "chashu pork", "tare being ladled"). Pick passages where a
  photo genuinely helps understanding; skip decorative filler.

### 2. Search

```bash
node scripts/fetch-image.mjs "<subject>" [--source=openverse|wikimedia|all] [--limit=8] [--min-width=1200]
```

Prefer Wikimedia results for Japanese food subjects (strong coverage, verifiable
licensing); Openverse widens the net. Only commercially safe licenses are returned:
cc0, pdm (public domain), by, by-sa. NC and ND variants are never acceptable (this
is a monetized site).

### 3. Judge candidates (your job, not the script's)

Pick the candidate that:

- Actually shows the *specific* subject (a shoyu bowl for a shoyu section, not any ramen).
- Looks like a real photograph: reject watermarks, collages, AI-looking renders, poor lighting.
- Is at least 1200px wide.

For hero images, open `foreign_landing_url` and spot-check that the license claim on
the source page matches (Openverse metadata occasionally goes stale).

### 4. Optimize + name

```bash
node scripts/optimize-image.mjs --url=<candidate url> --slug=<kebab-slug> [--hero] \
  --license=<license> --license-version=<x.y> --license-url=<license_url> \
  --creator="<creator>" --source-url=<foreign_landing_url> --title="<title>"
```

- `--hero` cover-crops to 1200x675 (16:9); inline images resize to max 1200px wide. Output is WebP.
- **Filename rule:** the slug is 3 to 6 descriptive kebab-case words including the
  post's subject term, e.g. `shoyu-ramen-tare-soy-sauce`, `kansui-alkaline-ramen-noodles`.
  Never generic names like `image1` or `photo`.
- If the download fails (dead URL, non-image response), move to the next candidate.
- Attribution is recorded automatically in `src/data/image-credits.json`; do not edit it by hand.

### 5. Insert into the post

The script prints ready-to-paste markup. Replace every TODO before committing.

**Hero** (frontmatter): paste `heroImage` and write a real `heroImageAlt`.
`PostLayout.astro` renders it below the header with `fetchpriority="high"` and the
credit line; published posts fail validation if `heroImage` is set without `heroImageAlt`.

**Inline**: add once near the top of the body:

```mdx
import Figure from '../../components/editorial/Figure.astro';
```

then paste the printed `<Figure>` block adjacent to the paragraph that explains the
concept, with blank lines before and after the block (MDX requirement):

```mdx
<Figure
  caption="Shoyu tare, the concentrated soy seasoning, ladled in before the broth."
  source="Guilhem Vellut via Wikimedia Commons (CC BY 2.0)"
  sourceHref="https://commons.wikimedia.org/wiki/File:Example.jpg"
>
  <img
    src="/images/shoyu-ramen-tare-soy-sauce.webp"
    alt="Amber soy sauce tare being poured into a white ramen bowl"
    width="1200"
    height="800"
    loading="lazy"
    decoding="async"
  />
</Figure>
```

**Alt text rules:** 8 to 20 words describing what is visible; no "image of" / "photo
of"; include the subject term naturally once; no em dashes; no keyword stuffing.

**Caption rules:** one sentence tying the image to the surrounding prose (teach,
don't label). Keep the `source` attribution exactly as the script printed it
(CC BY and CC BY-SA legally require visible credit).

### Loading rules (do not change these attributes)

| Image | Attributes | Why |
| --- | --- | --- |
| Hero | `fetchpriority="high"`, NO `loading` attr | It is the LCP element; lazy-loading it hurts LCP |
| Inline | `loading="lazy" decoding="async"`, NO `fetchpriority` | Below the fold; normal priority once scrolled near |
| All | explicit `width` + `height` | Reserves space, zero CLS |

### 6. Verify

```bash
pnpm run verify && pnpm run build && pnpm run audit
```

The audit's image gate needs at least one body `<img alt>` per published post; check
the post's row in the scorecard. Eyeball the post in `pnpm run dev`: hero + credit
render, figures sit next to the relevant prose, captions have no TODOs left.
