import type { APIRoute, GetStaticPaths } from 'astro';
import { copy, type Lang } from '../../i18n';
import { flatten } from '../../lib/i18n';

export const getStaticPaths: GetStaticPaths = () => [
  { params: { lang: 'en' } },
  { params: { lang: 'es' } },
];

export const GET: APIRoute = ({ params }) => {
  const lang = (params.lang === 'es' ? 'es' : 'en') as Lang;
  return new Response(JSON.stringify(flatten(copy[lang])), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
