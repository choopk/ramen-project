# Living Memory — How It Works & Day-to-Day Guide

A Hermes-style memory system for this repo that works with any agentic CLI. The
substrate is plain markdown + two shell scripts: agents read a small "hot" memory
at session start, do one unit of work, and write back what they learned at a
checkpoint. Background and design rationale: `../hermes-living-memory-research.md`.

## The files

| File                     | What it is                                                                                 | Who writes it                |
| ------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------- |
| `memory/MEMORY.md`       | Hot tier: repo lessons, always loaded, hard cap 2,200 chars                                | Agent (checkpoint) + you     |
| `memory/USER.md`         | Hot tier: model of you, always loaded, cap 1,400 chars                                     | Agent (inferred only) + you  |
| `memory/TASKS.md`        | Work queue: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked · `[H]` human-only | Agent + you                  |
| `memory/JOURNAL.md`      | Cold tier: append-only log, one entry per iteration, never edited                          | Agent (append only)          |
| `memory/PROMPT.md`       | The loop protocol — single source of truth, passed verbatim to any CLI                     | You (agent may only propose) |
| `memory/logs/`           | Raw CLI output per loop run (gitignored)                                                   | `agent-loop.sh`              |
| `memory/STOP`            | Sentinel: `touch memory/STOP` halts the loop (gitignored)                                  | You                          |
| `scripts/agent-loop.sh`  | The runtime: runs one CLI iteration at a time                                              | —                            |
| `scripts/memory-lint.sh` | Integrity check: caps + injection-pattern scan                                             | run after memory writes      |

Instruction wiring: **`AGENTS.md` is canonical** (read natively by OpenCode, Codex,
and most CLIs). `CLAUDE.md` is a thin shim that imports it via `@AGENTS.md`.
`opencode.json` force-loads `MEMORY.md` + `USER.md` into OpenCode sessions.
`PROMPT.md` is deliberately NOT auto-loaded anywhere — interactive sessions are
not loop iterations; the loop script passes it explicitly.

## How one loop iteration works

1. **Orient** — agent reads AGENTS.md, MEMORY.md, USER.md (once — frozen snapshot),
   TASKS.md, and the journal tail; checks `git status` for a crashed predecessor.
2. **Pick ONE task** — first `[ ]` in the queue, marks it `[~] (attempt N/3)`.
3. **Execute** — for posts: content-brief → write-content → snippet-optimizer →
   geo-audit (the SKILL.md files in `.claude/skills/`, followed as plain markdown).
4. **Verify** — `pnpm run verify`; drafts are gate-checked by temporarily flipping
   `draft: false`, running build+audit, then flipping back.
5. **Learning checkpoint** — mark the task, append a journal entry, pass candidate
   lessons through the integrity gate, fold survivors into MEMORY.md under its cap
   with a provenance tag, run `memory-lint.sh`.

The loop script wraps this: STOP-file check → queue-empty check (grep for `^- [ ]`)
→ run the CLI → lint → optional commit (only if lint AND verify pass; never pushes).

## The memory rules (why it stays trustworthy)

- **Frozen snapshot:** memory files are read once at session start and written only
  at the end. This keeps the Anthropic prompt-cache prefix byte-stable (cache reads
  cost 0.1× — mid-session memory edits forfeit that on both Claude Code and OpenCode).
- **Caps force consolidation:** at 2,200/1,400 chars (or every 5th journal entry) the
  agent rewrites the file — evicting superseded facts first, then AGENTS.md
  duplicates, then oldest-unused — and summarizes evicted clusters into one coarser
  fact instead of deleting. Never blind truncation.
- **Provenance tags:** every entry ends with `[human|agent · date]` (MEMORY.md) or
  `[stated|inferred · date]` (USER.md). Only human/stated entries are hard
  constraints. The agent may never tag its own inference as `stated`.
- **Integrity gate (anti-poisoning):** before anything enters MEMORY.md, the agent
  must reject text containing agent-directed instructions ("ignore previous…"),
  unverified URLs/commands, or claims from fetched web content. `memory-lint.sh`
  backstops this deterministically — consolidation is where poison becomes permanent.
- **Promotion rule:** standing fact true in 30 days → MEMORY.md · sometimes-useful
  procedure → proposed skill (human approves) · one-off event → journal only.

## Day-to-day with Claude Code

Interactive sessions — nothing to do. Claude Code loads `CLAUDE.md`, which imports
`AGENTS.md`; the living-memory section tells it to read MEMORY.md/USER.md before
content work and write back on finish.

Run the loop:

```bash
./scripts/agent-loop.sh claude --iterations 1      # one careful iteration
./scripts/agent-loop.sh claude --iterations 3 --commit   # a batch, auto-commit when green
touch memory/STOP                                  # halt after current iteration
```

Note: `claude` runs with `--dangerously-skip-permissions` inside the loop. Safer
alternative while building trust: edit the adapter to `--permission-mode acceptEdits`.

## Day-to-day with OpenCode

Interactive sessions — nothing to do. OpenCode reads `AGENTS.md` natively, and
`opencode.json`'s `instructions` array force-loads MEMORY.md + USER.md (OpenCode
doesn't follow `@path` imports, hence the explicit list).

Run the loop:

```bash
./scripts/agent-loop.sh opencode --iterations 1
```

The adapter uses `opencode run "$PROMPT"` (headless one-shot). Permissions come
from your OpenCode config — if iterations stall on approval prompts, add a
`permission` block to `opencode.json` (e.g. `"edit": "allow", "bash": "allow"`);
that also affects interactive sessions, so it's your call, not preconfigured here.

Any other CLI: `AGENT_CMD='mycli --auto --prompt' ./scripts/agent-loop.sh custom`.

## Cookbook

| I want to…                       | Do this                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| See what the agent learned       | `git diff memory/` after a run, or read the journal tail                                                                   |
| Review finished posts            | Check "Human review / publish queue" in `TASKS.md`, read the draft, flip `draft: false` yourself, mark the `[H]` item done |
| Add work                         | Add a `- [ ]` line to the Queue in `TASKS.md` (position = priority)                                                        |
| Unblock a `[!]` task             | Fix the underlying issue, move the line back to Queue as `- [ ]`                                                           |
| Correct the agent's model of you | Edit `USER.md` directly; change `[inferred …]` to `[stated …]` to confirm, or delete the line                              |
| Teach it a repo fact             | Add a bullet to `MEMORY.md` with `[human · date]` — stay under the cap                                                     |
| Halt a running loop              | `touch memory/STOP` (remove it before the next run)                                                                        |
| Check memory health              | `./scripts/memory-lint.sh`                                                                                                 |
| Smoke-test after changes         | Put a trivial task at the queue top, run one iteration, confirm journal entry + `[x]` + clean lint                         |

## Troubleshooting

- **Loop exits immediately, "task queue empty"** — no `- [ ]` items left; `[!]`/`[H]`
  items don't count. Add or unblock tasks.
- **Dirty tree / task stuck at `[~]`** — a crashed iteration. The next iteration's
  Orient step handles it (resume or revert its own files). To do it manually:
  `git status`, revert agent-created files, reset the task to `[ ]`.
- **Same task fails 3 attempts** — it lands in Blocked with a reason; it needs you.
- **memory-lint fails** — the run left an oversized or suspicious memory file; read
  the flagged lines before trusting or committing that iteration.
- **CLI exits non-zero 3× in a row** — loop aborts; check the newest file in
  `memory/logs/`.

## When to upgrade (scaling triggers, from the research brief)

- **JOURNAL.md past a few hundred entries** or grep visibly missing old-but-relevant
  lessons → move episodic search to SQLite + FTS5 (WAL mode, BM25); keep the
  markdown journal as the human-readable write path, DB as the index.
- **Keyword search missing paraphrased queries** → add sqlite-vec hybrid retrieval
  (local embeddings + reciprocal-rank fusion). Not before.
- **Wanting self-authored skills** → only after building create → sandboxed-test →
  register, plus a dangerous-code scanner and pending-by-default review. Until
  then the propose-only rule in PROMPT.md stands.
- **Multiple loops in parallel** → per-agent memory namespaces + append-only shared
  log + `flock` around shared-file consolidation; never last-write-wins.
