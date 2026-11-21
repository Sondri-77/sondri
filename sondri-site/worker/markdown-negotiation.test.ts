import { describe, expect, it } from 'bun:test';
import worker, { toMarkdownPath } from './index';
import type { Env } from './admin-auth';

interface MockAssetEntry {
  status: number;
  body: string;
  contentType: string;
}

function makeAssetsEnv(assets: Record<string, MockAssetEntry>): Env {
  return {
    ASSETS: {
      fetch: async (input) => {
        const req = input instanceof Request ? input : new Request(input);
        const pathname = new URL(req.url).pathname;
        const hit = assets[pathname];
        if (!hit) {
          return new Response('Not Found', {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
        return new Response(req.method === 'HEAD' ? null : hit.body, {
          status: hit.status,
          headers: { 'Content-Type': hit.contentType },
        });
      },
    },
  };
}

describe('Worker Markdown Negotiation & Discovery Headers', () => {
  it('maps root, insights, Watch directory hubs, leaf pages, and /ai-audit/ cleanly', () => {
    expect(toMarkdownPath('/')).toBe('/index.md');
    expect(toMarkdownPath('/index.html')).toBe('/index.md');
    expect(toMarkdownPath('/es/')).toBe('/es/index.md');
    expect(toMarkdownPath('/insights/')).toBe('/insights/index.md');
    expect(toMarkdownPath('/es/insights/')).toBe('/es/insights/index.md');
    expect(toMarkdownPath('/watch/')).toBe('/watch/index.md');
    expect(toMarkdownPath('/es/watch/')).toBe('/es/watch/index.md');
    expect(toMarkdownPath('/watch/services/')).toBe('/watch/services/index.md');
    expect(toMarkdownPath('/es/watch/services/')).toBe('/es/watch/services/index.md');
    expect(toMarkdownPath('/watch/guides/')).toBe('/watch/guides/index.md');
    expect(toMarkdownPath('/es/watch/guides/')).toBe('/es/watch/guides/index.md');
    expect(toMarkdownPath('/watch/pricing/')).toBe('/watch/pricing.md');
    expect(toMarkdownPath('/watch/services/aeo/')).toBe('/watch/services/aeo.md');
    expect(toMarkdownPath('/ai-audit/')).toBe('/ai-audit.md');
  });

  it('serves 200 text/markdown for /watch/ and watch.sondri.ai/pricing/ with Vary: Accept', async () => {
    const env = makeAssetsEnv({
      '/watch/index.md': { status: 200, body: '# Sondri Watch\n', contentType: 'text/markdown; charset=utf-8' },
      '/watch/pricing.md': { status: 200, body: '# Pricing\n', contentType: 'text/markdown; charset=utf-8' },
    });

    const watchRes = await worker.fetch(
      new Request('https://sondri.ai/watch/', { headers: { Accept: 'text/markdown' } }),
      env,
    );
    expect(watchRes.status).toBe(200);
    expect(watchRes.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(watchRes.headers.get('Vary')).toContain('Accept');
    expect(await watchRes.text()).toBe('# Sondri Watch\n');

    const subdomainRes = await worker.fetch(
      new Request('https://watch.sondri.ai/pricing/', { headers: { Accept: 'text/markdown' } }),
      env,
    );
    expect(subdomainRes.status).toBe(200);
    expect(subdomainRes.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(subdomainRes.headers.get('Vary')).toContain('Accept');
    expect(await subdomainRes.text()).toBe('# Pricing\n');
  });

  it('falls back to HTML (never 404) when Accept: text/markdown hits live pages without a .md mirror', async () => {
    const env = makeAssetsEnv({
      '/audit/': { status: 200, body: '<html>Audit Alias</html>', contentType: 'text/html; charset=utf-8' },
      '/pay/': { status: 200, body: '<html>Pay</html>', contentType: 'text/html; charset=utf-8' },
      '/404.md': { status: 200, body: '# 404', contentType: 'text/markdown; charset=utf-8' },
    });

    const auditRes = await worker.fetch(
      new Request('https://sondri.ai/audit/', { headers: { Accept: 'text/markdown' } }),
      env,
    );
    expect(auditRes.status).toBe(200);
    expect(auditRes.headers.get('Content-Type')).toContain('text/html');
    expect(auditRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(auditRes.headers.get('Vary')).toContain('Accept');

    const payRes = await worker.fetch(
      new Request('https://sondri.ai/pay/', { headers: { Accept: 'text/markdown' } }),
      env,
    );
    expect(payRes.status).toBe(200);
    expect(payRes.headers.get('Content-Type')).toContain('text/html');
    expect(payRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('returns 404 text/markdown when neither a .md mirror nor an HTML asset exists', async () => {
    const env = makeAssetsEnv({
      '/404.md': { status: 200, body: '# 404 Missing', contentType: 'text/markdown; charset=utf-8' },
    });

    const missingRes = await worker.fetch(
      new Request('https://sondri.ai/nonexistent-page/', { headers: { Accept: 'text/markdown' } }),
      env,
    );
    expect(missingRes.status).toBe(404);
    expect(missingRes.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(missingRes.headers.get('Vary')).toContain('Accept');
    expect(await missingRes.text()).toBe('# 404 Missing');
  });

  it('advertises alternate text/markdown Link headers only when the .md mirror asset exists', async () => {
    const env = makeAssetsEnv({
      '/watch/': { status: 200, body: '<html>Watch</html>', contentType: 'text/html; charset=utf-8' },
      '/watch/index.md': { status: 200, body: '# Watch', contentType: 'text/markdown; charset=utf-8' },
      '/other-page/': { status: 200, body: '<html>Other</html>', contentType: 'text/html; charset=utf-8' },
    });

    const withMd = await worker.fetch(new Request('https://sondri.ai/watch/'), env);
    expect(withMd.status).toBe(200);
    expect(withMd.headers.get('Link')).toBe(
      '</llms.txt>; rel="alternate"; type="text/plain", </watch/index.md>; rel="alternate"; type="text/markdown"',
    );

    const withoutMd = await worker.fetch(new Request('https://sondri.ai/other-page/'), env);
    expect(withoutMd.status).toBe(200);
    expect(withoutMd.headers.get('Link')).toBe('</llms.txt>; rel="alternate"; type="text/plain"');
  });
});
