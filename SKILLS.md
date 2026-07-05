# Skills for Ramen Guide

This site vendors eleven Claude skills from [`inhouseseo/superseo-skills`](https://github.com/inhouseseo/superseo-skills) plus the in-repo `geo-audit` skill to support a weekly content workflow. The five below are the active core flow; the rest stay dormant until they're useful (see [Other vendored skills](#other-vendored-skills)).

## Install

The skills are **vendored locally** under `.claude/skills/`, so they travel with this repo and need no marketplace or global setup; a Claude session opened in this directory picks them up automatically, with each skill's `references/` material bundled alongside it.

```
.claude/skills/
  content-brief/SKILL.md          (+ references/)
  topic-cluster-planning/SKILL.md (+ references/)
  ... 12 skills total
```

Pinned to upstream commit [`0d8b6fc`](https://github.com/inhouseseo/superseo-skills/commit/0d8b6fc03e63dd0fe75163e5fcdcff592435510c), carried over from the techfinanceblog template. To update, re-copy the `skills/` directories from a fresh clone of the upstream repo (not via `/plugin marketplace add`).

## Active skills

### 1. `topic-cluster-planning`: used **once per pillar topic**

Builds a pillar + cluster structure so individual posts ladder up to topical authority instead of being one-off articles. Run this **before** writing any post in a new topic area.

**Invocation example:**

```
/topic-cluster-planning

Topic: Japanese ramen styles
Audience: English-speaking food enthusiasts and Japan travelers who want to understand, order, and cook ramen.
Constraints:
- I'll publish ~1 cluster post per week.
- We have no domain authority yet, so prioritize long-tail comparison and "what is" queries.
- The pillar page should be evergreen; cluster posts can be more seasonal/travel-tied.
```

**Output:** a pillar page outline plus 10–20 cluster post titles with target keywords and internal-link map.

### 2. `content-brief`: used **once per post**

Turns one of the cluster titles from step 1 into a brief: target keyword, search intent, outline, internal-link candidates, featured-snippet target.

**Invocation example:**

```
/content-brief

Post: "Tonkotsu vs shoyu ramen: what's actually the difference?"
Target keyword: tonkotsu vs shoyu
Search intent: informational, readers deciding what to order or cook
Length target: 1,800 words
Cluster: Japanese ramen styles (pillar TBD)
```

**Output:** a markdown brief; paste it straight into the next step.

### 3. `write-content`: used **once per post (first draft)**

Takes a brief from step 2 and produces a first draft that avoids the usual AI-slop tells (em-dash overload, "in today's fast-paced world", false-balance hedging). **Always human-edit the output** before publishing; the skill produces a draft, not a finished post.

**Invocation example:**

```
/write-content

Brief: <paste content-brief output>
Voice: warm but precise, food-writer credibility without the purple prose. Assume the reader is curious, not an expert.
Format: MDX. Use ## for sections, > for pull quotes. No first-person plural ("we"/"our") unless it's an editorial statement.
```

### 4. `featured-snippet-optimizer`: used **once per post (after editing)**

After your human edit pass, run this to restructure the first 100 words so the post becomes eligible for the featured snippet on the target keyword. Disproportionately high CTR for the cost (15 minutes per post).

**Invocation example:**

```
/featured-snippet-optimizer

Post: <paste the edited post>
Target query: "what is tonkotsu ramen"
Snippet format: paragraph (40–60 words) followed by a short comparison table.
```

### 5. `geo-audit`: final per-post pass (native skill)

Not from superseo; authored in-repo (carried from the template). Run it last, after the snippet
pass, to make the post citable by AI answer engines (ChatGPT, Perplexity, Google AI Overviews,
Claude). It scores six generative-engine-optimization signals (answer-first structure,
self-contained quotable passages, quantified-claim density, Q&A structure, freshness, entity
clarity) and returns concrete edits. It reports only: you apply the edits, obeying the
`write-content` ruleset.

**Invocation example:**

```
/geo-audit

Post: src/content/blog/<slug>.mdx
```

## Weekly workflow

Once per topic area:

```
/topic-cluster-planning  →  master plan
```

Then weekly, per post:

```
pick a cluster title
   ↓
/content-brief           →  brief
   ↓
/write-content           →  first draft
   ↓
human edit (1–2 hours)   →  finished post
   ↓
/featured-snippet-optimizer → snippet-optimized post
   ↓
/geo-audit               →  citation-ready post (apply the edits)
   ↓
add to src/content/blog/<slug>.mdx with draft: false
   ↓
git push → Cloudflare Pages deploys
```

## Dormant skills (present, not yet in the routine)

These are vendored alongside the rest but stay out of the weekly flow until a triggering condition is met. They are installed; just do not reach for them yet.

| Skill                   | Start using when                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `eeat-audit`            | Posts start making health/nutrition-adjacent claims, or before applying to ad networks (trust signals matter). |
| `semantic-gap-analysis` | The site has ≥10 posts in a cluster; needs corpus to compare against ranking competitors.                      |
| `page-audit`            | A post has been live ≥30 days and shows up in Search Console; needs real ranking data to analyze.              |

## Other vendored skills

Also present in `.claude/skills/`, available when the need arises:

| Skill               | What it's for                                                                    |
| ------------------- | -------------------------------------------------------------------------------- |
| `improve-content`   | Revise an existing draft or live post: tighten, restructure, fix weak sections.  |
| `keyword-deep-dive` | Deep keyword/SERP research for a single target term before briefing.             |
| `linkbuilding`      | Internal/external link strategy and outreach angles for a post or cluster.       |
| `expert-interview`  | Generate expert-interview questions and synthesize answers into source material. |

## Not carried over from the template

- `visual-structure-pass` — depends on the template's chart component kit (`src/components/charts/`), which this lean starter dropped. Pull both together if data-viz posts become a thing here.
- `model-watch`, `refresh-ai-pricing`, `refresh-model-pricing`, `refresh-world-cup-forecast`, `refresh-memory-prices` — AI/finance data-tracker skills tied to datasets that don't exist in this repo.
