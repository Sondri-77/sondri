import type { APIRoute } from 'astro';
import { getPosts } from '../lib/insights';
import { renderLlmsTxt, textResponse } from '../lib/markdown';
import { getSolutions } from '../lib/solutions';

export const GET: APIRoute = async ({ site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  const [enSolutions, enPosts, esSolutions, esPosts] = await Promise.all([
    getSolutions('en'),
    getPosts('en'),
    getSolutions('es'),
    getPosts('es'),
  ]);
  return textResponse(renderLlmsTxt(origin, enSolutions, enPosts, esSolutions, esPosts));
};
