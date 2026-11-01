/* Reading the solutions collection against the matrix (./matrix.ts). The
   page shows only what is built: an industry gets a tab once it has a
   published solution. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { industries } from './matrix';

export * from './matrix';

/** Published solutions in their set order. Drafts show in `astro dev` only. */
export const getSolutions = async () =>
  (await getCollection('solutions', (s) => import.meta.env.DEV || !s.data.draft)).sort(
    (a, b) => a.data.order - b.data.order,
  );

/** Industry rows that have at least one solution to show, in matrix order. */
export const industryTabs = (solutions: CollectionEntry<'solutions'>[]) =>
  industries
    .map((i) => ({ ...i, solutions: solutions.filter((s) => s.data.industry === i.id) }))
    .filter((i) => i.solutions.length > 0);
