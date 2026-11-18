import type { APIRoute } from 'astro';
import { mdResponse, renderNotFoundMarkdown } from '../lib/markdown';

export const GET: APIRoute = ({ site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  return mdResponse(renderNotFoundMarkdown(origin));
};
