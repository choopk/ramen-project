#!/usr/bin/env bash
# CLI-agnostic living-memory agent loop.
#
# Usage:
#   scripts/agent-loop.sh [claude|opencode|codex|gemini] [--iterations N] [--commit]
#   AGENT_CMD='mycli --auto --prompt' scripts/agent-loop.sh custom --iterations 2
#
# Halt any time with:  touch memory/STOP
# Protocol lives in memory/PROMPT.md; task queue in memory/TASKS.md.
set -u -o pipefail
cd "$(dirname "$0")/.."

CLI="claude"
if [ $# -gt 0 ] && [ "${1#--}" = "$1" ]; then
  CLI="$1"
  shift
fi

MAX_ITER=3
COMMIT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --iterations) MAX_ITER="$2"; shift 2 ;;
    --commit)     COMMIT=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

PROMPT="$(cat memory/PROMPT.md)"
mkdir -p memory/logs

run_cli() {
  # Adapter table (bash-3.2-safe). Auto-approve flags are required for headless
  # runs; safer Claude alternative: --permission-mode acceptEdits.
  case "$CLI" in
    claude) claude --dangerously-skip-permissions -p "$PROMPT" ;;
    # opencode permissions come from opencode.json; grant edit/bash there if prompted:
    opencode) opencode run "$PROMPT" ;;
    # codex --full-auto sandboxes network off, which breaks SERP research:
    codex)  codex exec --dangerously-bypass-approvals-and-sandbox "$PROMPT" ;;
    gemini) gemini --yolo -p "$PROMPT" ;;
    *)
      if [ -z "${AGENT_CMD:-}" ]; then
        echo "unknown CLI '$CLI' and AGENT_CMD is unset" >&2
        return 2
      fi
      sh -c "$AGENT_CMD \"\$1\"" _ "$PROMPT"
      ;;
  esac
}

FAILS=0
i=1
while [ "$i" -le "$MAX_ITER" ]; do
  if [ -e memory/STOP ]; then
    echo "memory/STOP present — halting."
    break
  fi
  if ! grep -q '^- \[ \]' memory/TASKS.md; then
    echo "task queue empty — done."
    break
  fi

  LOG="memory/logs/$(date +%Y%m%d-%H%M%S)-iter${i}-${CLI}.log"
  echo "=== iteration $i/$MAX_ITER via $CLI -> $LOG"
  if run_cli 2>&1 | tee "$LOG"; then
    FAILS=0
    LINT_OK=1
    scripts/memory-lint.sh || LINT_OK=0
    if [ "$COMMIT" -eq 1 ]; then
      if [ "$LINT_OK" -eq 1 ] && pnpm run verify >/dev/null 2>&1; then
        git add -A && git commit -m "agent-loop($CLI): iteration $i" ||
          echo "commit failed (pre-commit hook?) — continuing uncommitted"
      else
        echo "memory-lint or verify FAILED — leaving iteration $i uncommitted for inspection"
      fi
    fi
  else
    FAILS=$((FAILS + 1))
    echo "CLI exited non-zero ($FAILS consecutive)"
    if [ "$FAILS" -ge 3 ]; then
      echo "3 consecutive failures — aborting."
      exit 1
    fi
    sleep $((30 * FAILS))
  fi
  i=$((i + 1))
done
