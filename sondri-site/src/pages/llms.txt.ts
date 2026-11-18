import type { APIRoute } from 'astro';
import { getPosts } from '../lib/insights';
import { renderLlmsTxt, textResponse } from '../lib/markdown';
import { getSolutions } from '../lib/solutions';

export const GET: APIRoute = async ({ site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  const [solutions, posts] = await Promise.all([getSolutions(), getPosts()]);
  return textResponse(renderLlmsTxt(origin, solutions, posts));
};
