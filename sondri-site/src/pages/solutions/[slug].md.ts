import type { APIRoute, GetStaticPaths } from 'astro';
import { mdResponse, renderSolutionMarkdown } from '../../lib/markdown';
import { getSolutions, slugOf } from '../../lib/solutions';

export const getStaticPaths: GetStaticPaths = async () => {
  const solutions = await getSolutions('en');
  return solutions.map((solution) => ({ params: { slug: slugOf(solution) }, props: { solution } }));
};

export const GET: APIRoute = ({ props, site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  return mdResponse(renderSolutionMarkdown(origin, props.solution, 'en'));
};
