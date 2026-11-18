import type { APIRoute, GetStaticPaths } from 'astro';
import { mdResponse, renderSolutionMarkdown } from '../../lib/markdown';
import { getSolutions } from '../../lib/solutions';

export const getStaticPaths: GetStaticPaths = async () => {
  const solutions = await getSolutions();
  return solutions.map((solution) => ({ params: { slug: solution.id }, props: { solution } }));
};

export const GET: APIRoute = ({ props, site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  return mdResponse(renderSolutionMarkdown(origin, props.solution));
};
