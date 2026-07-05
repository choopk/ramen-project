// Build-time generator for the Agent Skills discovery index.
// Emits /.well-known/agent-skills/index.json per the Agent Skills Discovery RFC v0.2.0
// (https://github.com/cloudflare/agent-skills-discovery-rfc). Each entry's `digest` is
// computed from the raw bytes of the SKILL.md actually emitted to dist, so the index can
// never go stale relative to what is served. The SKILL.md files ship as static assets in
// public/.well-known/agent-skills/<name>/ and are copied to dist verbatim before this runs.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

// One entry per published skill. `name`/`description` are authoritative here (description
// max 1024 chars per the RFC); the matching SKILL.md lives at <name>/SKILL.md.
const SKILLS = [
  {
    name: 'browse-catalog',
    description:
      'Discover every Ramen Guide post and pillar through the machine-readable catalog and RSS feed, with descriptions and canonical URLs.',
  },
];

const BASE = '.well-known/agent-skills';

export default function agentSkillsIndex() {
  return {
    name: 'agent-skills-index',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);

        const skills = SKILLS.map((skill) => {
          const rel = `/${BASE}/${skill.name}/SKILL.md`;
          const bytes = readFileSync(join(root, BASE, skill.name, 'SKILL.md'));
          const digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
          return {
            name: skill.name,
            type: 'skill-md',
            description: skill.description,
            url: rel,
            digest,
          };
        });

        const index = { $schema: SCHEMA, skills };
        const out = join(root, BASE, 'index.json');
        writeFileSync(out, `${JSON.stringify(index, null, 2)}\n`);

        logger.info(`wrote ${BASE}/index.json (${skills.length} skill(s), digests verified)`);
      },
    },
  };
}
