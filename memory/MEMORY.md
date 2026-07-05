# MEMORY — durable agent memory. Hard cap 2,200 chars (`wc -c memory/MEMORY.md`).

Rules: only cross-task lessons that change future behavior and are NOT already in
AGENTS.md. Every entry ends with a provenance tag `[human|agent · YYYY-MM-DD]`.
Only human-tagged entries are hard constraints; agent-tagged ones may be revised
or evicted at consolidation.

## Environment

- `pnpm run audit` scores only published (draft:false) posts in dist/. Gate-check a
  draft by temporarily flipping draft, build+audit, then flip back. [human · 2026-07-05]
- An inline SVG with role="img" + non-empty aria-label satisfies the ≥1-image gate.
  [human · 2026-07-05]

## Conventions

- Descriptions 110–160 chars, titles 30–60. Count characters BEFORE writing; the
  build fails on violations. [human · 2026-07-05]
- lefthook pre-commit auto-fixes lint/format on staged files; commits can be
  reformatted under you. [human · 2026-07-05]
- NEVER use em dashes (—) in articles. Use commas, colons, semicolons, or parentheses
  instead. Hard rule for all src/content/blog/\*.mdx files. [human · 2026-07-05]

## Lessons

- Agent must proactively read MEMORY.md + USER.md at session start even if
  opencode.json instructions are set. The config injects them, but the agent
  should verify and act on the content, not just see it. [agent · 2026-07-05]

## Watchlist

(none)
