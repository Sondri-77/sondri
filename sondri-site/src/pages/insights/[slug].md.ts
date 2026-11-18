import type { APIRoute, GetStaticPaths } from 'astro';
import { getPosts } from '../../lib/insights';
import { mdResponse, renderPostMarkdown } from '../../lib/markdown';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
};

export const GET: APIRoute = ({ props, site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  return mdResponse(renderPostMarkdown(origin, props.post));
};
