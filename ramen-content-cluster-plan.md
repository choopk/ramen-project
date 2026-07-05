# Ramen Content Cluster Plan

## Cluster Overview

- **Seed topic:** Japanese ramen (styles, broths, noodles, toppings, regional bowls, culture)
- **Difficulty:** Moderate — strong competition from Serious Eats, Just One Cookbook, Michelin Guide; no single English site owns "complete ramen authority"
- **Current content:** 3 stub posts (~300 words each, no images), 8 trust pages
- **Target:** 16 posts total (hub + 15 spokes) — clears the 15-post AdSense audit gate (`scripts/audit-approval.mjs`) with one post of margin
- **Timeline:** 5 months to full cluster; hub launches Month 3 with 6+ spokes already live

---

## Hub Page (Pillar)

**Format:** Ultimate Guide — "The Complete Guide to Japanese Ramen"

Format reasoning: a single long-form ultimate guide (vs pillar-with-chapters or category page) because the site is new — one URL should concentrate all "Japanese ramen" relevance and internal-link equity rather than splitting it across chapter pages.

| Field          | Value                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Target keyword | Japanese ramen                                                                                      |
| Word count     | 4,000–5,000                                                                                         |
| Purpose        | Own broad "Japanese ramen" query; cover full landscape at high level, link to every spoke for depth |

### H2 Sections

1. What Is Ramen? (definition + brief history)
2. The Four Ramen Broth Families (shoyu, shio, miso, tonkotsu — overview with links)
3. How Tare Defines a Bowl (tare vs broth distinction)
4. Ramen Noodles: Kansui, Thickness, and Shape
5. Essential Ramen Toppings (chashu, ajitama, menma, nori, negi)
6. Regional Ramen Across Japan (map overview, links to deep-dive)
7. Modern Styles: Tsukemen, Mazesoba, Abura Soba
8. How to Order and Eat Ramen (etiquette guide)
9. FAQ (5–10 questions)
10. Further Reading (links to all spokes)

### What the hub does NOT cover in depth

The hub summarizes; spokes answer. Explicitly out of hub scope: step-by-step techniques (ajitama, chashu), per-region deep dives, noodle science details, full etiquette walkthroughs, style-vs-style comparisons, and cross-cuisine comparisons. Each of those is a spoke — the hub gives 1–2 paragraphs and links down. Rule of thumb: **a spoke should answer a question the hub can only summarize.**

---

## Spoke List (15 Articles)

Priority = publishing sequence order (easiest-to-rank long-tail first; see Publishing Sequence). Intent is informational throughout except the two comparison spokes (#11, #15).

| #   | Topic                                                  | Target Keyword              | Intent        | Difficulty | Type                 | Words | Hub Anchor            |
| --- | ------------------------------------------------------ | --------------------------- | ------------- | ---------- | -------------------- | ----- | --------------------- |
| 1   | Shoyu Ramen: The Complete Guide                        | shoyu ramen                 | Informational | Moderate   | Definition/guide     | 2,000 | "shoyu ramen"         |
| 2   | Shio Ramen: Salt-Based Simplicity                      | shio ramen                  | Informational | Easy       | Definition/guide     | 1,800 | "shio ramen"          |
| 3   | Miso Ramen: Hokkaido's Hearty Bowl                     | miso ramen                  | Informational | Moderate   | Definition/guide     | 2,000 | "miso ramen"          |
| 4   | Tonkotsu Ramen: Pork Bone Deep-Dive                    | tonkotsu ramen              | Informational | Hard       | Definition/guide     | 2,200 | "tonkotsu ramen"      |
| 5   | Ramen Noodles Explained: Kansui, Shape & Hydration     | ramen noodles types         | Informational | Easy       | Science/explainer    | 2,000 | "ramen noodles"       |
| 6   | Ramen Toppings: The Essential Guide                    | ramen toppings              | Informational | Moderate   | Listicle/guide       | 2,000 | "ramen toppings"      |
| 7   | Tare: The Secret Seasoning Behind Every Bowl           | what is tare ramen          | Informational | Easy       | Definition/explainer | 1,500 | "tare"                |
| 8   | Regional Ramen Across Japan: A Complete Map            | regional ramen Japan        | Informational | Easy       | Listicle/travel      | 3,000 | "regional ramen"      |
| 9   | How to Eat Ramen: Etiquette & Technique                | how to eat ramen            | Informational | Moderate   | How-to/guide         | 1,500 | "how to eat ramen"    |
| 10  | Tsukemen, Mazesoba & Abura Soba: Soupless Ramen Styles | tsukemen mazesoba aburasoba | Informational | Easy       | Comparison/guide     | 2,000 | "modern ramen styles" |
| 11  | Tonkotsu vs Shoyu: A Head-to-Head Comparison           | tonkotsu vs shoyu           | Comparison    | Easy       | Comparison           | 1,800 | "tonkotsu vs shoyu"   |
| 12  | The History of Ramen: From China to Japan              | history of ramen            | Informational | Moderate   | Narrative/historical | 2,000 | "history of ramen"    |
| 13  | Ajitama: The Perfect Ramen Egg                         | ramen egg                   | Informational | Moderate   | How-to               | 1,500 | "ramen egg"           |
| 14  | Chashu: Ramen's Braised Pork, Explained                | chashu pork                 | Informational | Moderate   | How-to/explainer     | 1,800 | "chashu"              |
| 15  | Ramen vs Pho vs Udon: What Sets Them Apart             | ramen vs pho                | Comparison    | Easy       | Comparison           | 1,800 | "ramen vs pho"        |

**Word counts are estimates.** Final target per post = average of the top-5 ranking results + 10%, read at `/content-brief` time. Never pad to hit a number.

---

## Internal Link Map

### Hub → Spoke

Hub links to all 15 spokes via TOC + contextual body links.

### Spoke → Hub

Every spoke links back to the hub (anchor: "complete guide to Japanese ramen" or similar).

**First-link rule (critical):** the first link from any spoke to the hub is what Google's algorithm weights most heavily. Make it contextual — within the article body, not a nav/footer link — with descriptive anchor text.

### Cross-Spoke Links

Each spoke links to 2–3 related spokes (sparingly — don't over-link). Every spoke below has ≥2 inbound and 2–3 outbound cross-links.

| Spoke           | Links to                                           |
| --------------- | -------------------------------------------------- |
| #1 Shoyu        | #7 Tare, #11 Comparison, #14 Chashu                |
| #2 Shio         | #7 Tare, #6 Toppings, #13 Ajitama                  |
| #3 Miso         | #8 Regional, #5 Noodles, #6 Toppings               |
| #4 Tonkotsu     | #5 Noodles, #9 Etiquette (kaedama), #11 Comparison |
| #5 Noodles      | #4 Tonkotsu, #10 Modern, #15 Vs Pho/Udon           |
| #6 Toppings     | #13 Ajitama, #14 Chashu, #2 Shio                   |
| #7 Tare         | #1 Shoyu, #2 Shio, #3 Miso                         |
| #8 Regional     | #3 Miso, #4 Tonkotsu, #12 History                  |
| #9 Etiquette    | #10 Modern, #6 Toppings                            |
| #10 Modern      | #8 Regional, #9 Etiquette, #12 History             |
| #11 Comparison  | #1 Shoyu, #4 Tonkotsu, #5 Noodles                  |
| #12 History     | #7 Tare, #8 Regional, #15 Vs Pho/Udon              |
| #13 Ajitama     | #6 Toppings, #14 Chashu, #2 Shio                   |
| #14 Chashu      | #6 Toppings, #4 Tonkotsu, #13 Ajitama              |
| #15 Vs Pho/Udon | #5 Noodles, #4 Tonkotsu, #1 Shoyu                  |

---

## Existing Content Mapping

| Existing Stub                           | Maps to          | Action                              |
| --------------------------------------- | ---------------- | ----------------------------------- |
| `guide-to-japanese-ramen-styles.mdx`    | **Hub (Pillar)** | Expand ~300 → 4,000+ words with TOC |
| `tonkotsu-vs-shoyu-broth-explained.mdx` | **#11**          | Expand ~300 → 1,800 words           |
| `regional-ramen-across-japan.mdx`       | **#8**           | Expand ~300 → 3,000 words           |

Note: `tonkotsu-vs-shoyu` and `regional-ramen` are already live (`draft: false`) as thin ~300-word pages. Expand them **first** — before writing new spokes — regardless of their slot in the sequence below; thin indexed content drags the whole domain. These are in-place revisions (set `updatedDate`), not new publish decisions.

---

## Publishing Sequence

Never publish the hub first — it launches Month 3 with 6 spokes already live, so it's never a link-less orphan.

| Month       | What to Publish                                      | Why                                                                       |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| **Month 1** | Expand live stubs (#8, #11); write spokes #1, #2, #5 | Fix thin live content first; then foundational low-competition long-tails |
| **Month 2** | Spokes #3, #4, #6 (Miso, Tonkotsu, Toppings)         | Complete four broth families + supporting content                         |
| **Month 3** | Hub page + Spoke #7 (Tare)                           | Hub launches with 8 spokes already published — no orphan page             |
| **Month 4** | Spokes #9, #10, #13, #14                             | Etiquette, modern styles, and the two high-volume topping how-tos         |
| **Month 5** | Spokes #12, #15                                      | History + cross-cuisine comparison; each links back to established hub    |

**Per-post pipeline** (from SKILLS.md): `/content-brief` → `/write-content` → human edit → `/featured-snippet-optimizer` → `/geo-audit` → publish with `draft: false`. Once the cluster reaches 10 live posts, run `/semantic-gap-analysis` on the weakest performers.

---

## SEO Considerations

- **Titles:** 30–60 chars, primary keyword near the front (build-enforced)
- **Descriptions:** 110–160 chars (build-enforced)
- **Schema:** `Article` on hub + all spokes; `FAQPage` on hub via `Faq.astro`; breadcrumbs everywhere
- **Images:** Every spoke needs ≥1 image with alt text (audit gate)
- **Snippet targets:** each post's `/content-brief` designates which H2 hosts the 40–60-word featured-snippet answer; add a FAQ section when 3+ People-Also-Ask questions exist for the keyword
- **Editorial components:** Use existing `Figure.astro`, `VersusHero.astro`, `Timeline.astro` (all in `src/components/editorial/`)

## GEO / AI-Search Considerations

Every post must pass the six `/geo-audit` signals before publishing:

1. **Answer-first:** a standalone answer to the title query in the first ~100 words
2. **Quotable passages:** self-contained 40–60-word passages an AI engine can lift verbatim
3. **Quantified claims:** 2–3 sourced data points per 300 words
4. **Q&A structure:** real questions as H2/H3s for informational intent
5. **Freshness:** `updatedDate` set and body dates matching frontmatter
6. **Entity clarity:** full names on first mention (e.g., "kansui (alkaline mineral water)")

**Zero-click reality check:** "what is tare ramen" and "how to eat ramen" are AI-Overview-prone queries (AI Overviews cut organic CTR ~58–61%). Those spokes exist for topical authority and AI citability — brands cited in AI answers earn measurably more clicks — not for direct click volume. Don't judge them on traffic alone.

**Hard invariants** (from `/geo-audit`): anonymous Organization byline — no Person schema, no personal names; FAQ markup only via `src/components/editorial/Faq.astro` (emits FAQPage JSON-LD); no em dashes in post bodies; never touch robots.txt.

### External Sources to Cite (Hub)

Authoritative, non-competitor sources only (research bodies, institutions, primary sources — never sites we compete with for these keywords):

1. Japan National Tourism Organization (JNTO)
2. George Solt, _The Untold History of Ramen_ (University of California Press) — academic anchor, especially for #12 History
3. Shin-Yokohama Ramen Museum (primary institution)
4. Nippon.com

**Verify every source URL before citing; never fabricate a source, statistic, or quote.** (Serious Eats was dropped from this list — it's a named competitor above; the Ramen Beast app may be cited only if verified at write time.)

---

## Success Metrics

| Milestone | Target                                                                  |
| --------- | ----------------------------------------------------------------------- |
| Month 3   | Hub ranking top 50 for "Japanese ramen"                                 |
| Month 6   | 3+ spokes ranking top 20 for long-tail keywords                         |
| Month 9   | Hub top 20; consistent organic traffic                                  |
| Month 12  | Topical authority established; 16 posts published, AdSense gate cleared |

---

## Next Steps

1. Expand the 2 live stub spokes (#8, #11), then write new spokes in sequence order
2. Run each post through the pipeline: `/content-brief` → `/write-content` → human edit → `/featured-snippet-optimizer` → `/geo-audit`
3. Build hub from existing stub in Month 3 (after 6+ spokes live)
4. Run `pnpm run build && pnpm run audit` after each batch
5. The agent loop (`scripts/agent-loop.sh`, task queue in `memory/TASKS.md`) works this plan one post per iteration; the human reviews and flips `draft: false`
