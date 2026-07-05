---
name: geo-audit
description: Make a single post or page maximally citable by AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Claude). Scores one piece of content on GEO (generative engine optimization) signals it does not yet hit, then outputs the exact edits. Use after a post is written and edited, or when asked to "GEO audit", make content "AI-ready", or "get cited by AI".
---

# GEO Audit

Score one post or page on how extractable and citable it is for AI answer engines, then
hand back concrete edits. AI engines lift self-contained, quantified, well-structured passages
into their answers and cite the source. This skill optimizes a single piece of content for that.
It is a per-post process, run after the human edit pass, not a site-wide or one-time job.

## Scope: what this is NOT

Do not duplicate the other vendored skills. Stay in the GEO lane:

- `featured-snippet-optimizer` already handles the first-100-words snippet block. Assume that
  ran. Audit everything else.
- `page-audit` / `eeat-audit` cover broad SEO and trust scoring. This skill is narrower:
  machine extractability and citation-readiness only.
- `write-content` owns the anti-AI-slop ruleset (no em dashes, banned vocabulary). Respect it in
  every edit you propose. Never reintroduce slop to chase a GEO score.

## The rubric

Score each of the six signals as pass / weak / fail, then propose specific edits for anything
not passing. Targets are guidance, not hard gates.

1. **Answer-first.** A direct, standalone answer to the page's core question appears in the first
   ~100 words. No throat-clearing preamble before the substance.
2. **Self-contained quotable passages.** The page contains several ~40 to 60 word passages that
   make a complete claim with no surrounding context needed. An engine can lift one verbatim and
   it still reads true and attributable. Flag long passages whose meaning depends on the prior
   paragraph.
3. **Quantified-claim density.** Roughly 2 to 3 concrete data points (numbers, dates, prices,
   percentages) per 300 words, each traceable to a source. Vague qualitative claims ("much
   cheaper", "many developers") are GEO-invisible. Push for the number.
4. **Q&A structure where intent is informational.** Real questions as H2/H3 headings, phrased the
   way a person would ask an engine, each followed immediately by a tight answer. Note where a
   FAQ block would help (see SchemaFAQ note below).
5. **Freshness.** `updatedDate` is set in frontmatter and recent when the content was materially
   touched. Stale-looking pages are cited less. Confirm dates in the body match frontmatter.
6. **Entity clarity.** Brands, products, models, and figures are named explicitly and consistently
   (full name on first mention, not just a pronoun or "it"). Engines extract entities; ambiguity
   costs citations.

## Steps

1. **Read the target.** A post under `src/content/blog/<slug>.mdx`, or a standalone page under
   `src/pages/`. Read its frontmatter and body.
2. **Score** all six signals. Be specific: quote the actual weak passage, do not just name the
   category.
3. **Propose edits** as concrete before/after rewrites that obey the `write-content` ruleset.
   For quantified-claim gaps, do not invent figures: either flag that a sourced number is needed,
   or pull from grounded, sourced claims already present elsewhere in the repo's content.
4. **Report**, do not auto-publish. Output a short scorecard (the six signals with pass/weak/fail)
   followed by the prioritized edit list. Leave the actual file edit and commit to the user unless
   they ask you to apply the changes.

## Invariants to never break

- **No Person schema, no personal byline.** This blog publishes anonymously as the brand
  Organization (see CLAUDE.md). GEO does not change that. Author E-E-A-T comes from
  `editorial-standards` and Organization signals, never a fabricated human author.
- **Never fabricate a statistic, source, or quote** to raise quantified-claim density. An
  invented number that gets cited is a trust disaster for a publication trading on accuracy.
  Real and sourced, or flagged as needed.
- **Do not touch `robots.txt` to "optimize" for AI.** The permissive allow-all is correct: the
  goal is to be crawled and cited, so all AI crawlers stay allowed.
- **No em dashes** in any proposed copy. Restructure with colons, periods, or commas.

## SchemaFAQ note

If a post gains a genuine FAQ section, use the existing `src/components/editorial/Faq.astro`
component: it renders the Q&A block and emits FAQPage JSON-LD, giving engines machine-readable
answer blocks. Flag posts with question-shaped headings that would benefit from converting to it.
