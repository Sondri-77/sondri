interface AssetsBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface Env {
  ASSETS: AssetsBinding;
}

const APEX_HOST = 'sondri.ai';
const WWW_HOST = 'www.sondri.ai';
const ASSET_EXT_RE = /\.(?:css|js|mjs|json|txt|xml|svg|png|jpe?g|webp|gif|ico|woff2?|mp4|webm|webmanifest|map)$/i;
const ASSET_PREFIX_RE = /^\/(?:_astro|brand|fonts|icons|img|i18n|\.well-known)\//;
const NOINDEX_PREFIX_RE = /^\/(?:pay|success|i18n)(?:\/|$)/;

function parseQuality(accept: string, mediaType: string): number {
  for (const part of accept.split(',')) {
    const [type, ...params] = part.trim().toLowerCase().split(';');
    if (type.trim() !== mediaType) continue;
    for (const p of params) {
      const [k, v] = p.trim().split('=');
      if (k === 'q') {
        const q = Number(v);
        return Number.isFinite(q) ? q : 1;
      }
    }
    return 1;
  }
  return -1;
}

export function wantsMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const mdQ = parseQuality(accept, 'text/markdown');
  if (mdQ <= 0) return false;
  const htmlQ = parseQuality(accept, 'text/html');
  return htmlQ < 0 || mdQ >= htmlQ;
}

export function toMarkdownPath(pathname: string): string {
  if (pathname === '/' || pathname === '/index.html') return '/index.md';
  if (pathname === '/es' || pathname === '/es/' || pathname === '/es/index.html') return '/es/index.md';
  if (pathname === '/insights' || pathname === '/insights/' || pathname === '/insights/index.html') {
    return '/insights/index.md';
  }
  if (pathname === '/es/insights' || pathname === '/es/insights/' || pathname === '/es/insights/index.html') {
    return '/es/insights/index.md';
  }
  const clean = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '');
  return clean.endsWith('.md') ? clean : `${clean}.md`;
}

function applyHeaders(
  res: Response,
  opts: { contentType?: string; varyAccept?: boolean; linkHeader?: string; noindex?: boolean } = {},
): Response {
  const headers = new Headers(res.headers);
  if (opts.varyAccept) {
    const existingVary = headers.get('Vary');
    if (!existingVary) {
      headers.set('Vary', 'Accept');
    } else if (!existingVary.toLowerCase().split(',').map((s) => s.trim()).includes('accept')) {
      headers.set('Vary', `${existingVary}, Accept`);
    }
  }
  if (opts.contentType) {
    headers.set('Content-Type', opts.contentType);
  }
  if (opts.linkHeader) {
    headers.set('Link', opts.linkHeader);
  }
  if (opts.noindex) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Enforce canonical https://sondri.ai for production hostnames.
    if (url.hostname === WWW_HOST || (url.hostname === APEX_HOST && url.protocol !== 'https:')) {
      const canonical = new URL(url.pathname + url.search, `https://${APEX_HOST}`);
      return Response.redirect(canonical.href, 301);
    }

    // Consolidate legacy ?lang=es query URLs to static localized routes.
    if (url.searchParams.get('lang') === 'es') {
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return Response.redirect(new URL('/es/', url.origin).href, 301);
      }
      if (/^\/(?:privacy|insights|solutions)(?:\/|$)/.test(url.pathname)) {
        const normalized = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
        return Response.redirect(new URL(`/es${normalized}`, url.origin).href, 301);
      }
    }

    // Serve /sitemap.xml as a 200 alias to Astro's /sitemap-index.xml so tools
    // and crawlers checking the default /sitemap.xml path succeed without redirects.
    if (url.pathname === '/sitemap.xml') {
      const sitemapRes = await env.ASSETS.fetch(new URL('/sitemap-index.xml', url));
      return applyHeaders(sitemapRes, { contentType: 'application/xml; charset=utf-8' });
    }

    const isGetOrHead = request.method === 'GET' || request.method === 'HEAD';
    const isNoindex = NOINDEX_PREFIX_RE.test(url.pathname);
    const isDocumentPath =
      !ASSET_PREFIX_RE.test(url.pathname) && !ASSET_EXT_RE.test(url.pathname);

    if (isGetOrHead && isDocumentPath && wantsMarkdown(request.headers.get('Accept'))) {
      const mdPath = toMarkdownPath(url.pathname);
      const mdRes = await env.ASSETS.fetch(new URL(mdPath, url));
      if (mdRes.status === 200) {
        return applyHeaders(
          new Response(request.method === 'HEAD' ? null : mdRes.body, { status: 200, headers: mdRes.headers }),
          { contentType: 'text/markdown; charset=utf-8', varyAccept: true, noindex: isNoindex },
        );
      }

      // Preserve _redirects (e.g. /about -> /) before falling back to Markdown 404.
      const origRes = await env.ASSETS.fetch(request);
      if (origRes.status >= 300 && origRes.status < 400) {
        return origRes;
      }

      const notFoundMd = await env.ASSETS.fetch(new URL('/404.md', url));
      if (notFoundMd.status === 200) {
        return applyHeaders(
          new Response(request.method === 'HEAD' ? null : notFoundMd.body, { status: 404, headers: notFoundMd.headers }),
          { contentType: 'text/markdown; charset=utf-8', varyAccept: true },
        );
      }

      return new Response('# 404 — Page Not Found\n\nSee https://sondri.ai/llms.txt\n', {
        status: 404,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          Vary: 'Accept',
        },
      });
    }

    const assetRes = await env.ASSETS.fetch(request);
    if (isNoindex) {
      return applyHeaders(assetRes, {
        varyAccept: assetRes.headers.get('Content-Type')?.includes('text/html') ?? false,
        noindex: true,
      });
    }

    if (assetRes.headers.get('Content-Type')?.includes('text/html')) {
      const mdPath = isDocumentPath ? toMarkdownPath(url.pathname) : null;
      const linkParts = ['</llms.txt>; rel="alternate"; type="text/plain"'];
      if (mdPath && assetRes.status === 200) {
        linkParts.push(`<${mdPath}>; rel="alternate"; type="text/markdown"`);
      }
      return applyHeaders(assetRes, { varyAccept: true, linkHeader: linkParts.join(', ') });
    }
    return assetRes;
  },
};
