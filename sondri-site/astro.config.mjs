// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';

// Canonical site URL. Set SITE_URL to build against another host.
const SITE = process.env.SITE_URL ?? 'https://sondri.ai';
const BUILD_LASTMOD = new Date().toISOString();

/**
 * Assigns search/AI sitemap priority, changefreq, and bilingual alternates.
 * @param {string} url
 */
function getSitemapMetadata(url) {
  const pathname = new URL(url).pathname;

  let changefreq = ChangeFreqEnum.MONTHLY;
  let priority = 0.8;

  if (
    pathname === '/' ||
    pathname === '/es/' ||
    pathname === '/watch/' ||
    pathname === '/es/watch/'
  ) {
    changefreq = ChangeFreqEnum.WEEKLY;
    priority = 1.0;
  } else if (pathname === '/watch/pricing/' || pathname === '/es/watch/pricing/') {
    changefreq = ChangeFreqEnum.WEEKLY;
    priority = 0.95;
  } else if (
    pathname === '/ai-audit/' ||
    pathname === '/watch/services/' ||
    pathname === '/es/watch/services/'
  ) {
    changefreq = ChangeFreqEnum.WEEKLY;
    priority = 0.9;
  } else if (
    pathname.startsWith('/watch/services/') ||
    pathname.startsWith('/es/watch/services/') ||
    pathname === '/watch/guides/' ||
    pathname === '/es/watch/guides/' ||
    pathname === '/watch/playbooks/' ||
    pathname === '/es/watch/playbooks/' ||
    pathname === '/watch/partners/' ||
    pathname === '/es/watch/partners/'
  ) {
    changefreq = ChangeFreqEnum.WEEKLY;
    priority = 0.85;
  } else if (pathname === '/watch/sample-report/' || pathname === '/es/watch/sample-report/') {
    changefreq = ChangeFreqEnum.MONTHLY;
    priority = 0.7;
  } else if (pathname === '/privacy/' || pathname === '/es/privacy/') {
    changefreq = ChangeFreqEnum.YEARLY;
    priority = 0.3;
  }

  if (pathname === '/ai-audit/') {
    return { changefreq, priority, lastmod: BUILD_LASTMOD };
  }

  const enPath =
    pathname === '/es/' ? '/' : pathname.startsWith('/es/') ? pathname.slice(3) : pathname;
  const esPath = enPath === '/' ? '/es/' : `/es${enPath}`;

  return {
    changefreq,
    priority,
    lastmod: BUILD_LASTMOD,
    links: [
      { lang: 'en', url: `${SITE}${enPath}` },
      { lang: 'es', url: `${SITE}${esPath}` },
      { lang: 'x-default', url: `${SITE}${enPath}` },
    ],
  };
}

/**
 * Reads BILLING_API_KEY from env or sibling billing-worker/.dev.vars for local `astro dev` only.
 * Never included in static builds or browser bundles.
 * @returns {string}
 */
function readLocalBillingApiKey() {
  if (process.env.BILLING_API_KEY?.trim()) {
    return process.env.BILLING_API_KEY.trim();
  }
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const devVarsPath = path.resolve(dir, '../billing-worker/.dev.vars');
    const raw = fs.readFileSync(devVarsPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (key !== 'API_KEY') continue;
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (val) return val;
    }
  } catch {
    /* ignore missing .dev.vars */
  }
  return '';
}

/**
 * Dev-only Vite middleware proxying same-origin `/api/admin/*` to local billing-worker (`127.0.0.1:8787`)
 * with server-side X-API-Key injection so the browser never handles API secrets.
 */
function localAdminDevProxyPlugin() {
  return {
    name: 'sondri-local-admin-proxy',
    /** @param {import('vite').ViteDevServer} server */
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        if (!reqUrl.startsWith('/api/admin')) {
          return next();
        }

        const parsedUrl = new URL(reqUrl, 'http://localhost');
        const method = (req.method || 'GET').toUpperCase();
        const sendJson = (/** @type {number} */ status, /** @type {unknown} */ payload) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'private, no-store');
          res.end(JSON.stringify(payload));
        };

        if (parsedUrl.pathname === '/api/admin/me') {
          if (method !== 'GET') {
            return sendJson(405, {
              success: false,
              error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
            });
          }
          return sendJson(200, {
            success: true,
            data: { email: 'local-dev@localhost', mode: 'local_dev' },
          });
        }

        /** @type {string | null} */
        let upstreamPath = null;
        /** @type {'GET' | 'POST'} */
        let expectedMethod = 'GET';

        if (parsedUrl.pathname === '/api/admin/orders') {
          expectedMethod = 'GET';
          upstreamPath = `/admin/orders${parsedUrl.search}`;
        } else if (parsedUrl.pathname === '/api/admin/subscriptions') {
          expectedMethod = 'GET';
          upstreamPath = `/admin/subscriptions${parsedUrl.search}`;
        } else if (parsedUrl.pathname === '/api/admin/customers') {
          expectedMethod = 'GET';
          upstreamPath = `/admin/customers${parsedUrl.search}`;
        } else {
          const portalMatch = parsedUrl.pathname.match(
            /^\/api\/admin\/customers\/([a-zA-Z0-9_-]+)\/portal$/,
          );
          if (portalMatch) {
            expectedMethod = 'POST';
            upstreamPath = `/customers/${encodeURIComponent(portalMatch[1])}/portal`;
          }
        }

        if (!upstreamPath) {
          return sendJson(404, {
            success: false,
            error: { code: 'NOT_FOUND', message: `Unknown admin route: ${parsedUrl.pathname}` },
          });
        }

        if (method !== expectedMethod) {
          return sendJson(405, {
            success: false,
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
          });
        }

        const apiKey = readLocalBillingApiKey();
        if (!apiKey) {
          return sendJson(503, {
            success: false,
            error: {
              code: 'LOCAL_API_KEY_MISSING',
              message:
                'Set BILLING_API_KEY in env or API_KEY in billing-worker/.dev.vars to connect locally.',
            },
          });
        }

        const baseUrl = (process.env.BILLING_API_URL || 'http://127.0.0.1:8787').replace(
          /\/+$/,
          '',
        );

        try {
          /** @type {string | undefined} */
          let bodyText;
          if (expectedMethod === 'POST') {
            /** @type {Buffer[]} */
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            bodyText = Buffer.concat(chunks).toString('utf8');
          }

          const upstreamRes = await fetch(`${baseUrl}${upstreamPath}`, {
            method: expectedMethod,
            headers: {
              'X-API-Key': apiKey,
              Accept: 'application/json',
              ...(expectedMethod === 'POST' ? { 'Content-Type': 'application/json' } : {}),
            },
            ...(bodyText !== undefined ? { body: bodyText } : {}),
          });

          const text = await upstreamRes.text();
          res.statusCode = upstreamRes.status;
          res.setHeader(
            'Content-Type',
            upstreamRes.headers.get('Content-Type') || 'application/json; charset=utf-8',
          );
          res.setHeader('Cache-Control', 'private, no-store');
          res.end(text);
        } catch {
          return sendJson(502, {
            success: false,
            error: {
              code: 'LOCAL_WORKER_OFFLINE',
              message: `Local billing-worker is unreachable at ${baseUrl}. Run "cd billing-worker && npm run dev" to load live local D1 data.`,
            },
          });
        }
      });
    },
  };
}

// Old routes are redirected to `/` by `public/_redirects`, which Cloudflare's
// static assets honour with a real 301 — Astro's `redirects` option would
// emit meta-refresh pages instead.
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.endsWith('/pay/') &&
        !page.endsWith('/success/') &&
        !page.endsWith('/audit/') &&
        !page.endsWith('/404/') &&
        !page.includes('/admin/'),
      namespaces: { news: false, image: false, video: false, xhtml: true },
      serialize(item) {
        return {
          ...item,
          ...getSitemapMetadata(item.url),
        };
      },
    }),
  ],
  vite: {
    plugins: [localAdminDevProxyPlugin()],
  },
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
