import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

import { SEO_LIMITS } from './lib/seo.mjs';

const blog = defineCollection({
  // Exclude underscore-prefixed files (e.g. _template.mdx) so they never load,
  // render, or get schema-validated. The glob base alone does not skip them.
  loader: glob({ pattern: ['**/*.mdx', '!**/_*.mdx'], base: './src/content/blog' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.string().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().optional().default(false),
      author: z.string().default('Ramen Guide'),
    })
    // Enforce the Ahrefs title/description limits only when publishing (draft: false).
    // Drafts stay editable; the same limits are re-checked on the rendered HTML by
    // src/integrations/seo-meta-guard.mjs at build time. Mirrors the publish gate.
    .superRefine((data, ctx) => {
      if (data.draft) return;
      const t = data.title.length;
      if (t < SEO_LIMITS.titleMin || t > SEO_LIMITS.titleMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['title'],
          message: `title is ${t} chars; Ahrefs needs ${SEO_LIMITS.titleMin}-${SEO_LIMITS.titleMax}`,
        });
      }
      const d = data.description.length;
      if (d < SEO_LIMITS.descMin || d > SEO_LIMITS.descMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['description'],
          message: `description is ${d} chars; Ahrefs needs ${SEO_LIMITS.descMin}-${SEO_LIMITS.descMax}`,
        });
      }
    }),
});

export const collections = { blog };
