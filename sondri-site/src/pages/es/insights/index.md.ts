import type { APIRoute } from 'astro';
import { getPosts } from '../../../lib/insights';
import { mdResponse, renderInsightsIndexMarkdown } from '../../../lib/markdown';

export const GET: APIRoute = async ({ site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  const posts = await getPosts('es');
  return mdResponse(renderInsightsIndexMarkdown(origin, posts, 'es'));
};
