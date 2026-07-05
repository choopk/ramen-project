# Hermes-Style Living Memory — Research Brief

Purpose: a self-contained reference on how Hermes Agent's memory system works, how
this repo's lean clone of it works (`memory/` + `scripts/agent-loop.sh`), and the open
questions worth researching next. Written to be pasted into a Claude research session
("how do I implement something similar?") without needing any other context.

---

## 1. What Hermes Agent is

Hermes Agent is a general-purpose autonomous agent whose defining trait is that its
loop _learns_, not just executes. Its pipeline (the `AIAgent` class) runs seven stages:

1. User input processing
2. Prompt assembly — system instructions (personality, memory, skills, context files, tool schemas)
3. Provider resolution — pick the LLM backend (model-agnostic: Nous Portal, OpenRouter, OpenAI, custom)
4. Model execution
5. Tool dispatch and observation
6. Loop continuation until the task converges
7. **Learning checkpoint** — after complex interactions, create/refine skills, persist memory entries, consolidate session knowledge

Stage 7 is the differentiator vs Claude Code and OpenClaw: "the loop is not just
executing, it is also learning."

## 2. Hermes' memory architecture (the part we cloned)

### Hot tier: two capped, always-injected markdown files

| File        | Cap                       | Contents                                                                                       |
| ----------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `MEMORY.md` | 2,200 chars (~800 tokens) | Agent's own notes: environment facts, project conventions, tool quirks, discovered workarounds |
| `USER.md`   | 1,375 chars (~500 tokens) | Model of the user: identity, preferences, communication style, workflow habits                 |

Key mechanics:

- **Injected into every conversation** (~1,300 tokens total) — cheap enough that no retrieval step is needed for the hot tier.
- **Frozen snapshot pattern:** loaded from disk ONCE at session start, never mutated mid-session. This keeps the Anthropic prompt-cache prefix stable, reportedly saving 80–90% of input-token cost on long sessions. Tradeoff: cache efficiency over per-turn freshness.
- **Caps are a forcing function:** when a file hits its limit, the agent is prompted to merge or prune entries — never silently drop them. Curation happens through a `memory` tool with `add` / `replace` / `remove` actions.
- Deduplication runs at load time.

### Cold tier: searchable session archive

- All conversation history lives in **SQLite (WAL mode)** with an **FTS5 full-text index** (content-table-backed, so the index stays compact; triggers keep it synced).
- **Two-stage recall:** (1) FTS5 search across all historical messages; (2) a cheap auxiliary model (Gemini Flash) summarizes the top matches _focused on the query_ — the main agent gets summaries, not raw transcripts.
- Write contention handled with jitter retry (20–150 ms random sleep) instead of SQLite's busy handler.
- Pluggable external memory providers exist (Honcho, Mem0, Supermemory, ~8 total).

### Procedural tier: self-writing skills

When Hermes solves a complex multi-step problem, it writes a reusable skill document
so it never solves the same problem from scratch again. Agent-authored skills live
alongside human-authored ones and are refined during use. (In Claude Code and
OpenClaw, skills are human-authored only.)

### Prompt composition and instruction files

- System prompt layering: base personality (`SOUL.md`) → memory (`MEMORY.md`, `USER.md`) → skills → context files → tool guidance → model-specific directives.
- Project context files resolve **first-match-wins**: `.hermes.md`/`HERMES.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`; all capped at 20,000 chars with smart truncation.
- **Progressive disclosure** throughout: broad personality + memory at startup; skill bodies loaded on activation; tool schemas only for enabled toolsets (40+ tools grouped into per-session toolsets).

### Comparison points

|                  | Claude Code                                                             | OpenClaw                            | Hermes                                     |
| ---------------- | ----------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------ |
| Memory substrate | File-backed transcripts + `CLAUDE.md` injected per turn, LRU file cache | Plugin-replaceable memory providers | SQLite + frozen markdown snapshot          |
| Skills           | Human-authored                                                          | Human-authored, plugin ecosystem    | **Self-authored + human**                  |
| Proactivity      | Reactive (waits for input)                                              | Heartbeat daemon (~30 min checks)   | Built-in cron, natural-language scheduling |
| Model            | Anthropic                                                               | varies                              | Model-agnostic                             |

## 3. The transferable design pattern

Strip the implementation away and Hermes' memory is four tiers that map onto the
classic memory taxonomy:

1. **Working memory** = the context window itself (ephemeral).
2. **Semantic memory** = small, capped, curated, always-injected files (`MEMORY.md`, `USER.md`). Caps force consolidation; always-injecting removes the retrieval problem for the facts that matter most.
3. **Episodic memory** = append-only history (sessions/journal), unbounded but never injected wholesale — searched and _summarized on demand_ by a cheap model.
4. **Procedural memory** = skill files, promoted from repeated episodic lessons.

Plus two loop-level rules:

- **A learning checkpoint is an explicit stage**, not an emergent behavior. The agent is _instructed_ to persist, consolidate, and promote at the end of every iteration.
- **Consolidation is triggered, not scheduled:** cap overflow (or an iteration count) triggers rewrite-and-prune, so memory quality is maintained by construction.

## 4. What this repo implemented (`memory/` + `scripts/agent-loop.sh`)

A lean, CLI-agnostic clone: plain markdown + one bash script, no database, no daemon.
The loop's job is ramen content production (one post per iteration), but the substrate
is generic.

| Hermes concept                     | This repo                                                                                                                  | Deviation / rationale                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `MEMORY.md` (2,200 chars)          | `memory/MEMORY.md`, same cap, checked with `wc -c`                                                                         | Same                                                                                   |
| `USER.md` (1,375 chars)            | `memory/USER.md`, cap 1,400                                                                                                | Same idea                                                                              |
| SQLite + FTS5 session archive      | `memory/JOURNAL.md`, append-only, one entry per iteration                                                                  | Greppable flat file; no DB. Agent reads only the tail (`tail -60`)                     |
| Learning checkpoint (loop stage 7) | §4 of `memory/PROMPT.md`: journal entry → fold lessons into MEMORY.md under cap → promotion rule                           | Same, enforced by prompt                                                               |
| Consolidation on cap overflow      | Cap overflow OR every 5th journal entry → rewrite MEMORY.md from scratch                                                   | Journal count is the clock; no timers                                                  |
| Self-writing skills                | **Deliberately disabled**: agent may only _propose_ CLAUDE.md/skill edits in the journal                                   | Safety: human reviews before instructions change                                       |
| `AIAgent` loop runtime             | `scripts/agent-loop.sh`: while-loop over any headless CLI (`claude -p`, `codex exec`, `gemini -p`, `AGENT_CMD` for others) | The "runtime" is bash; the protocol travels in the prompt                              |
| Prompt assembly                    | `memory/PROMPT.md` passed verbatim as the CLI prompt; it instructs the agent to read the memory files itself               | No dependence on any CLI's context-file discovery — this is what makes it CLI-agnostic |
| Instruction-file hierarchy         | `AGENTS.md` (canonical, cross-tool) + `CLAUDE.md` (thin `@AGENTS.md` shim) + `opencode.json` `instructions` array          | One protocol, per-tool shims (post-research restructure)                               |
| Cron/proactivity                   | Manual kick-off only; `--iterations N` cap + `memory/STOP` sentinel                                                        | Trust must be earned first                                                             |
| (no Hermes equivalent)             | `memory/TASKS.md` checkbox queue (`[ ]/[~]/[x]/[!]/[H]`), grep-detectable                                                  | Hermes gets goals from the user each session; an unattended loop needs a durable queue |

Known simplifications vs Hermes: no cross-session search (journal is small enough
to grep for now — upgrade trigger and path documented in `memory/README.md`); no
memory tool — the agent edits the markdown directly under protocol rules, backed by
`scripts/memory-lint.sh` (write-time integrity scan) and provenance tags. The
frozen-snapshot rule IS now adopted (read memory once at session start, write only
at the checkpoint) to keep the prompt-cache prefix stable.

## 5. Open research questions (paste these into a Claude research session)

Memory quality and consolidation:

1. What consolidation policies beat "rewrite under a char cap"? (e.g. decay scores, access-frequency weighting, generative summarization of evicted items into coarser facts)
2. How should an agent decide MEMORY.md vs journal vs skill — are there principled promotion criteria beyond "seen in 2+ episodes"?
3. How do you _evaluate_ a memory system? (benchmarks: LoCoMo, MemBench; metrics: recall of decision-relevant facts, harmful-stale-memory rate, token cost per retained fact)
4. Optimal cap sizing: is ~1,300 tokens of always-injected memory the right spend vs a bigger cap + retrieval?

Retrieval and the cold tier:

5. When does a flat greppable journal stop scaling, and what's the lightest upgrade path (SQLite FTS5 like Hermes, sqlite-vec embeddings, or an external provider like Mem0/Letta/Supermemory)?
6. Two-stage recall (search → cheap-model summarization focused on the query): what are the failure modes, and does it beat direct RAG injection?
7. Frozen snapshot vs per-turn freshness: quantify the prompt-cache-vs-staleness tradeoff for long sessions on the Anthropic API.

Self-improvement and safety:

8. Self-authored skills: what guardrails make agent-written skills safe to auto-load (review queues, sandboxed trial runs, versioning/rollback, provenance tags)?
9. Memory poisoning: how does a bad journal entry or fabricated "lesson" propagate through consolidation, and what integrity checks catch it?
10. Should USER.md-style preference inference be explicit-signal-only (as this repo does) or model-inferred, and how do you keep inferred preferences correctable?

Architecture:

11. Multi-agent shared memory: can several CLI loops share one `memory/` safely (locking, merge conflicts, per-agent vs shared namespaces)?
12. How do Claude Code's native mechanisms (CLAUDE.md, auto-memory directories, hooks, subagents, background tasks) map onto each Hermes tier — what's already built vs worth building?
13. Compare this file-based approach against MemGPT/Letta's OS-style paged memory and against OpenClaw's provider plugins: when does each win?

Suggested research prompt:

> I have a file-based "living memory" harness for agentic CLIs (design attached).
> Research current best practices (2025–2026) for agent memory systems — consolidation
> policies, episodic retrieval, self-authored skills, memory benchmarks — and recommend
> concrete upgrades to this design, with tradeoffs and citations.

## 6. Sources

- [Chapter 8: Memory Systems and State Persistence (Claude Code vs. Hermes Agent) — Ken Huang](https://kenhuangus.substack.com/p/chapter-8-memory-systems-and-state)
- [The Anatomy of an Agent: What Lives Inside Claude Code, OpenClaw, and Hermes Agent — Rishabh Bhandari](https://medium.com/design-bootcamp/the-anatomy-of-an-agent-what-lives-inside-claude-code-openclaw-and-hermes-agent-41cc467f42a6)
- [Hermes Agent Masterclass — Avi Chawla](https://blog.dailydoseofds.com/p/hermes-agent-masterclass)
- [Rebuilt Hermes Inside Claude Code — Plaban Nayak](https://levelup.gitconnected.com/rebuilt-hermes-inside-claude-code-b8d9c4ca5d21)
- This repo: `memory/PROMPT.md` (protocol), `scripts/agent-loop.sh` (runtime), `CLAUDE.md` §"Living memory & agent loop"
