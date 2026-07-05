import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

// Resolves a source file's "last modified" date for SEO freshness signals
// (sitemap lastmod, OG article:modified_time, schema dateModified).
//
// Source of truth is each file's last git commit date (%cI, ISO 8601), so freshness
// is fully automatic: commit and push, and every signal updates with no frontmatter upkeep.
//
// To stay fast as the post count grows, the whole repo's per-file commit dates are resolved
// in ONE git history walk, not one subprocess per file. The walk runs once, lazily, on the
// first lookup, and results are memoized. The cost is a single git process per build
// regardless of how many posts exist. Files missing from history (e.g. uncommitted) fall
// back to file mtime, then to undefined (the caller then omits the signal).

const cache = new Map();
let walked = false;

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    // git log over a large history can exceed the 1MB default; give it room.
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

// Single pass over history. `git log --name-only` lists commits newest-first, each followed
// by the paths it touched, so the FIRST time a path appears is its most recent commit: record
// it once, never overwrite. A NUL byte (%x00) prefixes each commit's date line, giving a
// delimiter that cannot occur inside a path. --date-order keeps the newest-first guarantee
// across branches; --no-renames keeps paths as they appear in each commit's tree.
function walkHistory() {
  let raw;
  try {
    raw = git([
      '-c',
      'core.quotePath=false',
      'log',
      '--date-order',
      '--no-renames',
      '--format=%x00%cI',
      '--name-only',
    ]);
  } catch {
    return; // no git, or not a repo: every lookup falls back to mtime
  }
  for (const chunk of raw.split('\0')) {
    if (!chunk) continue;
    const lines = chunk.split('\n');
    const date = lines[0].trim();
    if (!date) continue;
    for (let i = 1; i < lines.length; i++) {
      const file = lines[i].trim();
      if (file && !cache.has(file)) cache.set(file, date);
    }
  }
}

function ensureWalked() {
  if (walked) return;
  walked = true;
  walkHistory();
}

function fileMtime(filePath) {
  try {
    return statSync(filePath).mtime.toISOString();
  } catch {
    return undefined;
  }
}

// Returns an ISO 8601 date string, or undefined if the file cannot be resolved.
export function lastmodFor(filePath) {
  ensureWalked();
  const key = filePath.replace(/^\.\//, '');
  if (cache.has(key)) return cache.get(key);
  // Not in git history (uncommitted/new): fall back to mtime, and cache the result
  // (including undefined) so a missing file is not re-stat'd on every lookup.
  const value = fileMtime(key);
  cache.set(key, value);
  return value;
}

let shallowWarned = false;

// Tripwire for shallow clones (e.g. a shallow Cloudflare Pages checkout), where the history
// walk sees too few commits and every file collapses to one date. Warns once at build time.
export function isShallowRepo() {
  let out;
  try {
    out = git(['rev-parse', '--is-shallow-repository']).trim();
  } catch {
    return false;
  }
  if (out === 'true' && !shallowWarned) {
    shallowWarned = true;
    console.warn(
      '[lastmod] shallow git clone detected: per-file lastmod will be degraded (all dates may collapse to one commit).',
    );
  }
  return out === 'true';
}
