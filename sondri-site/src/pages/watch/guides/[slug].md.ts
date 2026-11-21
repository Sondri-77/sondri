import type { APIRoute, GetStaticPaths } from 'astro';
import { getWatchGuides, type WatchGuideEntry } from '../../../data/watch-content';
import { mdResponse } from '../../../lib/markdown';
import { renderWatchGuideDetailMarkdown } from '../../../lib/watch-markdown';

export const getStaticPaths: GetStaticPaths = () => {
  return getWatchGuides('en').map((guide) => ({
    params: { slug: guide.slug },
    props: { guide },
  }));
};

export const GET: APIRoute = ({ props, site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  return mdResponse(renderWatchGuideDetailMarkdown(origin, props.guide as WatchGuideEntry, 'en'));
};
