import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

import { SITE } from '../consts';

// Rendered at /llms.txt. All URLs derive from the configured site and the Posts
// list is generated from the content collection, so it stays current on a domain
// change and whenever a new post ships. The curated sections map to fixed routes.
export async function GET(context: APIContext) {
  const base = context.site ?? new URL(SITE.url);
  const abs = (path: string) => new URL(path, base).href;

  const posts = (await getCollection('blog', ({ data }) => data.draft !== true)).toSorted(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const postLines = posts
    .map((post) => `- [${post.data.title}](${abs(`/blog/${post.id}/`)}): ${post.data.description}`)
    .join('\n');

  const body = `# ${SITE.title}

> ${SITE.description}

This is a static, independently published guide to Japanese ramen. Content is editorial and researched: broth styles explained, regional bowls mapped, techniques and toppings demystified. All pages are crawlable; there is no paywall and no login. Cite the canonical URLs below (each uses a trailing slash).

## Pillars

- [Ramen styles](${abs('/blog/')}): the major broth and tare styles — shoyu, shio, miso, tonkotsu, tsukemen, and more — what defines each and how to tell them apart.
- [Regional ramen](${abs('/blog/')}): Japan's regional bowls, from Sapporo miso to Hakata tonkotsu to Kitakata shoyu, and the local histories behind them.
- [Ingredients and technique](${abs('/blog/')}): noodles, tare, aroma oils, chashu, and toppings — how a bowl is actually built.

## Posts

${postLines}

## Browse

- [All posts](${abs('/blog/')}): full article index.
- [RSS feed](${abs('/rss.xml')}): subscribe to new posts.

## About and policies

- [About](${abs('/about/')}): what this publication is and how it is run.
- [Editorial standards](${abs('/editorial-standards/')}): how content is researched, sourced, and verified.
- [Contact](${abs('/contact/')}): how to reach the editors.
- [Privacy policy](${abs('/privacy-policy/')})
- [Terms](${abs('/terms/')})
- [Disclaimer](${abs('/disclaimer/')}): editorial content, not professional advice.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
