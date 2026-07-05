#!/usr/bin/env bash
# Deterministic integrity check for the living-memory files.
# Catches cap overflows and prompt-injection patterns BEFORE consolidation makes
# them permanent (a poisoned "lesson" folded into MEMORY.md is injected into every
# future session). Run after any write to memory/MEMORY.md or memory/USER.md.
# Exit 0 = clean, 1 = violations.
set -u
cd "$(dirname "$0")/.."

FAIL=0

check_cap() {
  size=$(wc -c <"$1" | tr -d ' ')
  if [ "$size" -gt "$2" ]; then
    echo "LINT FAIL: $1 is ${size} chars (cap $2) — consolidate, don't truncate"
    FAIL=1
  fi
}
check_cap memory/MEMORY.md 2200
check_cap memory/USER.md 1400

# Injection/poisoning patterns that must never live in always-injected memory.
PATTERNS='ignore (all |any )?(previous|prior|above) (instructions|rules)'
PATTERNS="$PATTERNS|disregard (the )?(previous|prior|above|system)"
PATTERNS="$PATTERNS|you are now|new system prompt|act as (the )?system"
PATTERNS="$PATTERNS|do not (tell|inform|alert) the (user|human|operator)"
PATTERNS="$PATTERNS|exfiltrat|reveal (your|the) (system|hidden|secret)"
PATTERNS="$PATTERNS|dangerously-skip|bypass-approvals|--yolo"
for f in memory/MEMORY.md memory/USER.md; do
  if grep -qiE "$PATTERNS" "$f"; then
    echo "LINT FAIL: suspicious pattern in $f:"
    grep -niE "$PATTERNS" "$f"
    FAIL=1
  fi
done

# Every memory bullet should carry a provenance tag (warn-only).
for f in memory/MEMORY.md memory/USER.md; do
  untagged=$(grep -cE '^- ' "$f" | tr -d ' ')
  tagged=$(grep -cE '\[(human|agent|stated|inferred)[^]]*\]' "$f" | tr -d ' ')
  if [ "$untagged" -gt "$tagged" ]; then
    echo "LINT WARN: $f has entries without a provenance tag ([human|agent|stated|inferred · date])"
  fi
done

[ "$FAIL" -eq 0 ] && echo "memory-lint: clean"
exit "$FAIL"
