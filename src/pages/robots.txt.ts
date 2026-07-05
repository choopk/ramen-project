import type { APIContext } from 'astro';

import { SITE } from '../consts';

// Rendered at /robots.txt. The sitemap URL is derived from the configured site
// so it never goes stale on a domain change. AI answer engines are explicitly
// welcomed, consistent with /llms.txt and the site's GEO posture.
export function GET(context: APIContext) {
  const sitemapURL = new URL('sitemap-index.xml', context.site ?? SITE.url).href;

  // Content-Signal declares usage preferences, distinct from access (contentsignals.org).
  // Specific User-agent groups do not inherit the `*` group, so this is repeated per bot.
  const contentSignal = 'Content-Signal: search=yes, ai-input=yes, ai-train=no';

  const aiBots = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-Web',
    'PerplexityBot',
    'Google-Extended',
  ];

  const aiBotRules = aiBots
    .map((bot) => `User-agent: ${bot}\n${contentSignal}\nAllow: /`)
    .join('\n\n');

  const body = `# ${SITE.title} robots policy
#
# Content-Signal declares how this content may be used (contentsignals.org):
# search and AI grounding are welcome; please do not train models on it.

User-agent: *
${contentSignal}
Allow: /

# AI answer engines are explicitly welcome (see /llms.txt).
${aiBotRules}

Sitemap: ${sitemapURL}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
