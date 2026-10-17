/* Insights: the blog. One Markdown file per post in src/content/insights/;
   the filename is the slug (/insights/<slug>/). */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    /** One or two sentences: the card excerpt, the meta description, the lede. */
    excerpt: z.string(),
    /** The mono label over the title — "Solutions", "Insights", "Field notes". */
    category: z.string(),
    date: z.coerce.date(),
    author: z.string().default('Sondri'),
    /** Drafts build in dev and are left out of production builds. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { insights };
