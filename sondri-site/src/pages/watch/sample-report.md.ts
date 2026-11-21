import type { APIRoute } from 'astro';
import { mdResponse } from '../../lib/markdown';
import { renderWatchSampleReportMarkdown } from '../../lib/watch-markdown';

export const GET: APIRoute = ({ site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  return mdResponse(renderWatchSampleReportMarkdown(origin, 'en'));
};
