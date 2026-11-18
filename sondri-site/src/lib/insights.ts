import { getCollection } from 'astro:content';
import type { Lang } from '../i18n';

export const slugOf = (p: { id: string }) => p.id.replace(/^es\//, '');

/** Published posts for a locale (`en` or `es`), newest first. Drafts show in `astro dev` only. */
export const getPosts = async (lang: Lang = 'en') =>
  (
    await getCollection('insights', (p) => {
      const isEs = p.id.startsWith('es/');
      const matchesLocale = lang === 'es' ? isEs : !isEs;
      return matchesLocale && (import.meta.env.DEV || !p.data.draft);
    })
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

export const fmtDate = (d: Date, lang: Lang = 'en') =>
  d.toLocaleDateString(lang === 'es' ? 'es-419' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

/** Minutes at ~230 words a minute, never less than one. */
export const readMins = (md = '') => Math.max(1, Math.round(md.split(/\s+/).filter(Boolean).length / 230));
