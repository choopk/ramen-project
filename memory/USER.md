# USER — model of the human operator. Hard cap 1,400 chars (`wc -c memory/USER.md`).

Every entry ends with `[stated|inferred · YYYY-MM-DD]`. Only stated (or
human-confirmed) preferences are hard constraints; inferred ones decay — confirm
or drop them at consolidation. Never mark an inference as stated.

- Solo operator of Ramen Guide; works across multiple agentic CLIs (Claude Code
  and OpenCode primary; Codex/Gemini possible). [stated · 2026-07-05]
- Goal: AdSense approval first (≥15 quality posts per `pnpm run audit`), then
  organic growth. Content depth is the lever. [stated · 2026-07-05]
- Publishing is human-only: the loop never flips draft:false on new posts; it
  queues `[H] review & publish` tasks instead. [stated · 2026-07-05]
- Prefers lean, hand-inspectable mechanisms: markdown + shell, no state machines.
  [stated · 2026-07-05]

## Observed preferences

(none yet — record only real signals, tagged [inferred · date])
