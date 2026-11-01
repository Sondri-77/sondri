/* Content collections. Insights: the blog, one Markdown file per post in
   src/content/insights/ (/insights/<slug>/). Solutions: one file per named
   solution in src/content/solutions/ (/solutions/<slug>/), placed on the
   matrix in src/lib/matrix.ts. The filename is the slug. */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { areaIds, industryIds } from './lib/matrix';

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
    /** The solution this post writes up (a solutions slug), linked both ways. */
    solution: z.string().optional(),
    /** Drafts build in dev and are left out of production builds. */
    draft: z.boolean().default(false),
  }),
});

const solutions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/solutions' }),
  schema: z.object({
    /** The product name, as the tab and the page title show it. */
    name: z.string(),
    /** One line under the name: what it does, in the buyer's words. */
    tagline: z.string(),
    /** Two or three sentences: the story on the industry tab, the meta description, the lede. */
    summary: z.string(),
    /** Who it's for, in a phrase ("land acquisition teams"). */
    audience: z.string(),
    industry: z.enum(industryIds),
    /** Every solution area it uses; the first is its home column. */
    areas: z.array(z.enum(areaIds)).min(1),
    /** Three to five things it does, for the tab and the page's opening. */
    highlights: z.array(z.string()).min(3).max(5),
    /** The Insights post that writes it up, if there is one. */
    post: z.string().optional(),
    /** The demo video under public/ (under 25 MB, the Workers asset limit),
        shown framed under the page head, with its poster and a one-line
        caption. The demos carry burned-in captions, so there is no track. */
    media: z
      .object({ src: z.string(), poster: z.string(), alt: z.string(), caption: z.string().optional() })
      .optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { insights, solutions };
