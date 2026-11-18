import type { APIRoute } from 'astro';
import { BOOK_HREF, CONTACT_EMAIL } from '../../data';
import { getPosts, slugOf as postSlug } from '../../lib/insights';
import { getSolutions, slugOf as solSlug } from '../../lib/solutions';

export const GET: APIRoute = async ({ site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  const [enSolutions, enPosts, esSolutions, esPosts] = await Promise.all([
    getSolutions('en'),
    getPosts('en'),
    getSolutions('es'),
    getPosts('es'),
  ]);

  const catalog = {
    version: '1.0',
    name: 'Sondri',
    description:
      'Custom software, workflow automation, and practical AI integration built into the systems small and midsize companies already run.',
    url: origin,
    contact: {
      email: CONTACT_EMAIL,
      booking: BOOK_HREF,
    },
    resources: [
      { type: 'llms-txt', url: `${origin}/llms.txt`, mediaType: 'text/plain' },
      { type: 'llms-full-txt', url: `${origin}/llms-full.txt`, mediaType: 'text/plain' },
      { type: 'sitemap', url: `${origin}/sitemap-index.xml`, mediaType: 'application/xml' },
    ],
    markdownMirrors: [
      `${origin}/index.md`,
      `${origin}/es/index.md`,
      `${origin}/insights/index.md`,
      `${origin}/es/insights/index.md`,
      `${origin}/privacy.md`,
      `${origin}/es/privacy.md`,
      ...enSolutions.map((s) => `${origin}/solutions/${solSlug(s)}.md`),
      ...esSolutions.map((s) => `${origin}/es/solutions/${solSlug(s)}.md`),
      ...enPosts.map((p) => `${origin}/insights/${postSlug(p)}.md`),
      ...esPosts.map((p) => `${origin}/es/insights/${postSlug(p)}.md`),
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
