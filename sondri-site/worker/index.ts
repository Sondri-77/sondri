import {
  type Env,
  authorizeAdminRequest,
  handleAdminApiProxy,
  withPrivateSecurityHeaders,
} from './admin-auth';

export type { Env };

const APEX_HOST = 'sondri.ai';
const WWW_HOST = 'www.sondri.ai';
const WATCH_HOST = 'watch.sondri.ai';
const ASSET_EXT_RE = /\.(?:css|js|mjs|json|txt|xml|svg|png|jpe?g|webp|gif|ico|woff2?|mp4|webm|webmanifest|map)$/i;
const ASSET_PREFIX_RE = /^\/(?:_astro|brand|fonts|icons|img|i18n|\.well-known)\//;
const SHARED_ROOT_PREFIX_RE = /^\/(?:ai-audit|audit|pay|success|admin|privacy|es\/privacy|llms\.txt|llms-full\.txt|robots\.txt|sitemap\.xml|sitemap-index\.xml)(?:\/|$)/;
const NOINDEX_PREFIX_RE = /^\/(?:pay|success|admin|api\/admin|audit|i18n)(?:\/|$)/;

function renderAdminUnauthorizedHtml(status: number, code: string, message: string): string {
  const safeCode = code.replace(/[<>&"]/g, '');
  const safeMsg = message.replace(/[<>&"]/g, '');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${status} — Sondri Admin</title>
  <style>
    body{margin:0;background:#081f1f;color:#ebf3f2;font:15px/1.55 system-ui,-apple-system,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px}
    main{max-width:460px;background:#031919;border:1px solid rgba(255,255,255,.32);box-shadow:8px 8px 0 #fdb343;padding:28px}
    h1{margin:0 0 8px;font-size:20px;color:#fff}
    p{margin:0 0 12px;color:#b4ccca}
    code{color:#fdb343;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
    a{color:#fdb343}
  </style>
</head>
<body>
  <main>
    <h1>Access Restricted (${status})</h1>
    <p>${safeMsg}</p>
    <p><code>${safeCode}</code> · <a href="/">Return to sondri.ai</a></p>
  </main>
</body>
</html>`;
}

function rewriteWatchHostnamePath(url: URL): URL {
  const path = url.pathname;
  if (
    ASSET_PREFIX_RE.test(path) ||
    ASSET_EXT_RE.test(path) ||
    SHARED_ROOT_PREFIX_RE.test(path) ||
    path.startsWith('/watch') ||
    path.startsWith('/es/watch')
  ) {
    return url;
  }

  let targetPath: string;
  if (path === '/es' || path === '/es/') {
    targetPath = '/es/watch/';
  } else if (path.startsWith('/es/')) {
    targetPath = `/es/watch${path.slice(3)}`;
  } else if (path === '/') {
    targetPath = '/watch/';
  } else {
    targetPath = `/watch${path}`;
  }

  return new URL(`${targetPath}${url.search}`, url.origin);
}

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

const DIRECTORY_INDEX_MD_PATHS = new Set([
  '',
  '/es',
  '/insights',
  '/es/insights',
  '/watch',
  '/es/watch',
  '/watch/services',
  '/es/watch/services',
  '/watch/guides',
  '/es/watch/guides',
]);

function normalizeLeadingPath(pathname: string): string {
  const safe = pathname.replace(/\\/g, '/').replace(/^\/+/, '/');
  return safe.startsWith('/') ? safe : `/${safe}`;
}

export function toMarkdownPath(pathname: string): string {
  const clean = normalizeLeadingPath(pathname).replace(/\/index\.html$/, '').replace(/\/+$/, '');
  if (!clean) return '/index.md';
  if (DIRECTORY_INDEX_MD_PATHS.has(clean)) return `${clean}/index.md`;
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
    const rawUrl = new URL(request.url);
    const normalizedPathname = normalizeLeadingPath(rawUrl.pathname);

    // Enforce canonical https://sondri.ai and https://watch.sondri.ai in production.
    if (
      rawUrl.hostname === WWW_HOST ||
      ((rawUrl.hostname === APEX_HOST || rawUrl.hostname === WATCH_HOST) && rawUrl.protocol !== 'https:')
    ) {
      const targetHost = rawUrl.hostname === WATCH_HOST ? WATCH_HOST : APEX_HOST;
      const canonical = new URL(`https://${targetHost}`);
      canonical.pathname = normalizedPathname;
      canonical.search = rawUrl.search;
      return Response.redirect(canonical.href, 301);
    }

    const isAdminApiPath =
      normalizedPathname === '/api/admin' || normalizedPathname.startsWith('/api/admin/');
    const isAdminPagePath =
      normalizedPathname === '/admin' || normalizedPathname.startsWith('/admin/');

    if (isAdminApiPath || isAdminPagePath) {
      // Keep Cloudflare Access perimeter strictly on canonical sondri.ai.
      if (rawUrl.hostname === WATCH_HOST) {
        if (isAdminApiPath) {
          return withPrivateSecurityHeaders(
            Response.json(
              { success: false, error: { code: 'FORBIDDEN_HOST', message: 'Use sondri.ai for admin endpoints.' } },
              { status: 403 },
            ),
          );
        }
        const adminUrl = new URL(`https://${APEX_HOST}`);
        adminUrl.pathname = normalizedPathname;
        adminUrl.search = rawUrl.search;
        return Response.redirect(adminUrl.href, 302);
      }

      const normalizedAdminUrl = new URL(rawUrl.origin);
      normalizedAdminUrl.pathname = normalizedPathname;
      normalizedAdminUrl.search = rawUrl.search;
      const normalizedAdminReq =
        normalizedPathname !== rawUrl.pathname
          ? new Request(normalizedAdminUrl.href, request)
          : request;

      const auth = await authorizeAdminRequest(normalizedAdminReq, env);
      if (!auth.ok) {
        if (isAdminApiPath) {
          return withPrivateSecurityHeaders(
            Response.json(
              { success: false, error: { code: auth.code, message: auth.message } },
              { status: auth.status },
            ),
          );
        }
        return withPrivateSecurityHeaders(
          new Response(renderAdminUnauthorizedHtml(auth.status, auth.code, auth.message), {
            status: auth.status,
          }),
          { contentType: 'text/html; charset=utf-8' },
        );
      }

      if (isAdminApiPath) {
        return handleAdminApiProxy(normalizedAdminReq, env, auth);
      }

      const adminAssetRes = await env.ASSETS.fetch(normalizedAdminReq);
      return withPrivateSecurityHeaders(adminAssetRes);
    }

    const url = rawUrl.hostname === WATCH_HOST ? rewriteWatchHostnamePath(rawUrl) : rawUrl;
    const assetRequest = url.href !== rawUrl.href ? new Request(url.href, request) : request;

    // Consolidate legacy ?lang=es query URLs to static localized routes.
    if (url.searchParams.get('lang') === 'es') {
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return Response.redirect(new URL('/es/', rawUrl.origin).href, 301);
      }
      if (/^\/(?:privacy|insights|solutions|watch)(?:\/|$)/.test(url.pathname)) {
        const normalized = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
        const cleanPath =
          rawUrl.hostname === WATCH_HOST && normalized.startsWith('/watch/')
            ? normalized.slice('/watch'.length)
            : normalized;
        return Response.redirect(new URL(`/es${cleanPath}`, rawUrl.origin).href, 301);
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
      if (!isNoindex) {
        const mdPath = toMarkdownPath(url.pathname);
        const mdRes = await env.ASSETS.fetch(new URL(mdPath, url));
        if (mdRes.status === 200) {
          return applyHeaders(
            new Response(request.method === 'HEAD' ? null : mdRes.body, { status: 200, headers: mdRes.headers }),
            { contentType: 'text/markdown; charset=utf-8', varyAccept: true, noindex: isNoindex },
          );
        }
      }

      // Preserve _redirects (e.g. /about -> /) and fall back to HTML for live pages
      // that intentionally have no Markdown mirror (e.g. /audit/, /pay/, /success/).
      const origRes = await env.ASSETS.fetch(assetRequest);
      if (origRes.status >= 300 && origRes.status < 400) {
        return origRes;
      }
      if (origRes.status === 200) {
        return applyHeaders(origRes, { varyAccept: true, noindex: isNoindex });
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

    const assetRes = await env.ASSETS.fetch(assetRequest);
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
        const mdHead = await env.ASSETS.fetch(new Request(new URL(mdPath, url), { method: 'HEAD' }));
        if (mdHead.status === 200) {
          linkParts.push(`<${mdPath}>; rel="alternate"; type="text/markdown"`);
        }
      }
      return applyHeaders(assetRes, { varyAccept: true, linkHeader: linkParts.join(', ') });
    }
    return assetRes;
  },
};
