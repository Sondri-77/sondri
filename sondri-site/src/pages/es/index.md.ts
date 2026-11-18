import type { APIRoute } from 'astro';
import { getPosts } from '../../lib/insights';
import { mdResponse, renderHomeMarkdown } from '../../lib/markdown';
import { getSolutions } from '../../lib/solutions';

export const GET: APIRoute = async ({ site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  const [solutions, posts] = await Promise.all([getSolutions('es'), getPosts('es')]);
  return mdResponse(renderHomeMarkdown(origin, solutions, posts, 'es'));
};
