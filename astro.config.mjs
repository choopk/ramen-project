import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

import agentSkillsIndex from './src/integrations/agent-skills-index.mjs';
import seoMetaGuard from './src/integrations/seo-meta-guard.mjs';
import { isShallowRepo, lastmodFor } from './src/lib/lastmod.mjs';

// Warn early if the build runs in a shallow clone, where per-file lastmod degrades.
isShallowRepo();

// Map a sitemap URL back to the source file whose git history dates it.
function sourceFileForUrl(url) {
  const path = new URL(url).pathname.replace(/\/$/, '');
  if (path === '') return 'src/pages/index.astro';
  const blog = path.match(/^\/blog\/([^/]+)$/);
  if (blog) return `src/content/blog/${blog[1]}.mdx`;
  return `src/pages${path}.astro`;
}

export default defineConfig({
  // PLACEHOLDER — set the real production domain before launch.
  site: 'https://example.com',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    svelte(),
    sitemap({
      // Keep noindex pages out of the sitemap. A URL that is both submitted in
      // the sitemap and tagged noindex is a contradiction Search Console flags.
      // Mirror any page rendered with `noindex` (PageLayout) here.
      filter: (url) => !url.endsWith('/subscribed/'),
      serialize(item) {
        const lastmod = lastmodFor(sourceFileForUrl(item.url));
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
    seoMetaGuard(),
    agentSkillsIndex(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
