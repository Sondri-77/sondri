import { getCollection } from 'astro:content';

/** Published posts, newest first. Drafts show in `astro dev` only. */
export const getPosts = async () =>
  (await getCollection('insights', (p) => import.meta.env.DEV || !p.data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Minutes at ~230 words a minute, never less than one. */
export const readMins = (md = '') => Math.max(1, Math.round(md.split(/\s+/).filter(Boolean).length / 230));
