import type { APIRoute } from 'astro';
import { mdResponse, renderPrivacyMarkdown } from '../../lib/markdown';

export const GET: APIRoute = ({ site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  return mdResponse(renderPrivacyMarkdown(origin, 'es'));
};
