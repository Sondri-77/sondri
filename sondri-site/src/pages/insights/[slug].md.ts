import type { APIRoute, GetStaticPaths } from 'astro';
import { getPosts, slugOf } from '../../lib/insights';
import { mdResponse, renderPostMarkdown } from '../../lib/markdown';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPosts('en');
  return posts.map((post) => ({ params: { slug: slugOf(post) }, props: { post } }));
};

export const GET: APIRoute = ({ props, site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  return mdResponse(renderPostMarkdown(origin, props.post, 'en'));
};
