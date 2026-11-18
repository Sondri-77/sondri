interface AssetsBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface Env {
  ASSETS: AssetsBinding;
}

const APEX_HOST = 'sondri.ai';
const WWW_HOST = 'www.sondri.ai';
const ASSET_EXT_RE = /\.(?:css|js|mjs|json|txt|xml|svg|png|jpe?g|webp|gif|ico|woff2?|mp4|webm|webmanifest|map)$/i;
const ASSET_PREFIX_RE = /^\/(?:_astro|brand|fonts|icons|img|i18n)\//;

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
  if (pathname === '/insights' || pathname === '/insights/' || pathname === '/insights/index.html') {
    return '/insights/index.md';
  }
  const clean = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '');
  return clean.endsWith('.md') ? clean : `${clean}.md`;
}

function withVaryAccept(res: Response, contentType?: string): Response {
  const headers = new Headers(res.headers);
  const existingVary = headers.get('Vary');
  if (!existingVary) {
    headers.set('Vary', 'Accept');
  } else if (!existingVary.toLowerCase().split(',').map((s) => s.trim()).includes('accept')) {
    headers.set('Vary', `${existingVary}, Accept`);
  }
  if (contentType) {
    headers.set('Content-Type', contentType);
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

    const isGetOrHead = request.method === 'GET' || request.method === 'HEAD';
    const isDocumentPath =
      !ASSET_PREFIX_RE.test(url.pathname) && !ASSET_EXT_RE.test(url.pathname);

    if (isGetOrHead && isDocumentPath && wantsMarkdown(request.headers.get('Accept'))) {
      const mdPath = toMarkdownPath(url.pathname);
      const mdRes = await env.ASSETS.fetch(new URL(mdPath, url));
      if (mdRes.status === 200) {
        return withVaryAccept(
          new Response(request.method === 'HEAD' ? null : mdRes.body, { status: 200, headers: mdRes.headers }),
          'text/markdown; charset=utf-8',
        );
      }

      // Preserve _redirects (e.g. /about -> /) before falling back to Markdown 404.
      const origRes = await env.ASSETS.fetch(request);
      if (origRes.status >= 300 && origRes.status < 400) {
        return origRes;
      }

      const notFoundMd = await env.ASSETS.fetch(new URL('/404.md', url));
      if (notFoundMd.status === 200) {
        return withVaryAccept(
          new Response(request.method === 'HEAD' ? null : notFoundMd.body, { status: 404, headers: notFoundMd.headers }),
          'text/markdown; charset=utf-8',
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
    if (assetRes.headers.get('Content-Type')?.includes('text/html')) {
      return withVaryAccept(assetRes);
    }
    return assetRes;
  },
};
