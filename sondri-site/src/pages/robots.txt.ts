import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const origin = site ? site.origin : 'https://sondri.ai';
  const sitemap = new URL('/sitemap-index.xml', origin).href;
  const llms = new URL('/llms.txt', origin).href;

  const body = [
    '# Sondri robots.txt — allows search engines and AI search-discovery agents.',
    `# Agent & LLM context: ${llms}`,
    '',
    'User-agent: *',
    'Allow: /',
    'Disallow: /pay/',
    'Disallow: /success/',
    'Disallow: /i18n/',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
