import type { APIRoute, GetStaticPaths } from 'astro';
import { getWatchServices, type WatchServiceEntry } from '../../../data/watch-content';
import { mdResponse } from '../../../lib/markdown';
import { renderWatchServiceDetailMarkdown } from '../../../lib/watch-markdown';

export const getStaticPaths: GetStaticPaths = () => {
  return getWatchServices('en').map((service) => ({
    params: { slug: service.slug },
    props: { service },
  }));
};

export const GET: APIRoute = ({ props, site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  return mdResponse(
    renderWatchServiceDetailMarkdown(origin, props.service as WatchServiceEntry, 'en'),
  );
};
