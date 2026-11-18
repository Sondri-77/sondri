/* Reading the solutions collection against the matrix (./matrix.ts). The
   page shows only what is built: an industry gets a tab once it has a
   published solution. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { copy, type Lang } from '../i18n';
import { areas, industries, type AreaId, type IndustryId } from './matrix';

export * from './matrix';

export const slugOf = (s: { id: string }) => s.id.replace(/^es\//, '');

/** Published solutions for a locale (`en` or `es`) in their set order. */
export const getSolutions = async (lang: Lang = 'en') =>
  (
    await getCollection('solutions', (s) => {
      const isEs = s.id.startsWith('es/');
      const matchesLocale = lang === 'es' ? isEs : !isEs;
      return matchesLocale && (import.meta.env.DEV || !s.data.draft);
    })
  ).sort((a, b) => a.data.order - b.data.order);

/** Industry rows that have at least one solution to show, in matrix order. */
export const industryTabs = (solutions: CollectionEntry<'solutions'>[]) =>
  industries
    .map((i) => ({ ...i, solutions: solutions.filter((s) => s.data.industry === i.id) }))
    .filter((i) => i.solutions.length > 0);

export const localizedIndustryName = (id: IndustryId, lang: Lang = 'en') =>
  copy[lang].solutionIndustries[id];

export const localizedAreaName = (id: AreaId, lang: Lang = 'en') => {
  const idx = areas.findIndex((a) => a.id === id);
  return idx >= 0 ? copy[lang].solutionAreas[idx].name : id;
};
