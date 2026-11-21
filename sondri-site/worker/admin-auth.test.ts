import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import worker from './index';
import {
  clearJwksCache,
  handleAdminApiProxy,
  type Env,
} from './admin-auth';

const TEAM_DOMAIN = 'sondri.cloudflareaccess.com';
const AUD_TAG = 'test-access-aud-12345';

let privateKey: CryptoKey;
let publicJwk: JsonWebKey & { kid: string };

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signJwt(
  payload: Record<string, unknown>,
  kid = 'key-1',
  tamperSig = false,
): Promise<string> {
  const encoder = new TextEncoder();
  const headerB64 = toBase64Url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid })));
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signingInput = encoder.encode(`${headerB64}.${payloadB64}`);
  const sigBuf = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, signingInput);
  const sigBytes = new Uint8Array(sigBuf);
  if (tamperSig) {
    sigBytes[0] = sigBytes[0] ^ 0xff;
  }
  return `${headerB64}.${payloadB64}.${toBase64Url(sigBytes)}`;
}

function makeBaseEnv(overrides: Partial<Env> = {}): Env {
  return {
    ASSETS: {
      fetch: async (input) => {
        const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
        return new Response(`<html><body>Admin Static: ${u.pathname}</body></html>`, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      },
    },
    CF_ACCESS_TEAM_DOMAIN: TEAM_DOMAIN,
    CF_ACCESS_AUD: AUD_TAG,
    CF_ACCESS_ALLOWED_EMAILS: 'zee@sondri.ai,ops@sondri.ai',
    BILLING_API_KEY: 'super_secret_worker_key',
    ...overrides,
  };
}

describe('Cloudflare Access JWT Guard & Admin BFF Proxy', () => {
  beforeAll(async () => {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify'],
    );
    privateKey = keyPair.privateKey;
    const exported = (await crypto.subtle.exportKey('jwk', keyPair.publicKey)) as JsonWebKey;
    publicJwk = { ...exported, kid: 'key-1', alg: 'RS256', use: 'sig' };
  });

  beforeEach(() => {
    clearJwksCache();
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (u === `https://${TEAM_DOMAIN}/cdn-cgi/access/certs`) {
        return Response.json({ keys: [publicJwk] });
      }
      return new Response('Not mocked', { status: 500 });
    }) as typeof fetch;
  });

  it('fails closed with 503 when Cloudflare Access env vars are missing', async () => {
    const env = makeBaseEnv({ CF_ACCESS_TEAM_DOMAIN: undefined, CF_ACCESS_AUD: undefined });
    const pageRes = await worker.fetch(new Request('https://sondri.ai/admin/watch/'), env);
    expect(pageRes.status).toBe(503);
    expect(pageRes.headers.get('Cache-Control')).toBe('private, no-store');

    const apiRes = await worker.fetch(new Request('https://sondri.ai/api/admin/orders'), env);
    expect(apiRes.status).toBe(503);
  });

  it('rejects missing, expired, wrong-aud, and tampered JWTs with 401', async () => {
    const env = makeBaseEnv();
    const now = Math.floor(Date.now() / 1000);

    const noToken = await worker.fetch(new Request('https://sondri.ai/api/admin/orders'), env);
    expect(noToken.status).toBe(401);

    const expiredJwt = await signJwt({
      iss: `https://${TEAM_DOMAIN}`,
      aud: [AUD_TAG],
      exp: now - 60,
      email: 'zee@sondri.ai',
    });
    const expiredRes = await worker.fetch(
      new Request('https://sondri.ai/api/admin/orders', {
        headers: { 'Cf-Access-Jwt-Assertion': expiredJwt },
      }),
      env,
    );
    expect(expiredRes.status).toBe(401);

    const wrongAudJwt = await signJwt({
      iss: `https://${TEAM_DOMAIN}`,
      aud: ['wrong-aud'],
      exp: now + 300,
      email: 'zee@sondri.ai',
    });
    const wrongAudRes = await worker.fetch(
      new Request('https://sondri.ai/admin/watch/', {
        headers: { 'Cf-Access-Jwt-Assertion': wrongAudJwt },
      }),
      env,
    );
    expect(wrongAudRes.status).toBe(401);

    const tamperedJwt = await signJwt(
      {
        iss: `https://${TEAM_DOMAIN}`,
        aud: [AUD_TAG],
        exp: now + 300,
        email: 'zee@sondri.ai',
      },
      'key-1',
      true,
    );
    const tamperedRes = await worker.fetch(
      new Request('https://sondri.ai/api/admin/orders', {
        headers: { 'Cf-Access-Jwt-Assertion': tamperedJwt },
      }),
      env,
    );
    expect(tamperedRes.status).toBe(401);
  });

  it('rejects authenticated Access users not in CF_ACCESS_ALLOWED_EMAILS with 403', async () => {
    const env = makeBaseEnv();
    const now = Math.floor(Date.now() / 1000);
    const jwt = await signJwt({
      iss: `https://${TEAM_DOMAIN}`,
      aud: [AUD_TAG],
      exp: now + 300,
      email: 'stranger@example.com',
    });

    const res = await worker.fetch(
      new Request('https://sondri.ai/admin/watch/', {
        headers: { 'Cf-Access-Jwt-Assertion': jwt },
      }),
      env,
    );
    expect(res.status).toBe(403);
    expect(await res.text()).not.toContain('Admin Static');
  });

  it('allows valid Access header or CF_Authorization cookie on /admin/watch/ and /api/admin/me', async () => {
    const env = makeBaseEnv();
    const now = Math.floor(Date.now() / 1000);
    const jwt = await signJwt({
      iss: `https://${TEAM_DOMAIN}`,
      aud: [AUD_TAG],
      exp: now + 300,
      email: 'ZEE@SONDRI.AI',
    });

    const pageRes = await worker.fetch(
      new Request('https://sondri.ai/admin/watch/', {
        headers: { 'Cf-Access-Jwt-Assertion': jwt },
      }),
      env,
    );
    expect(pageRes.status).toBe(200);
    expect(pageRes.headers.get('Cache-Control')).toBe('private, no-store');
    expect(pageRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(await pageRes.text()).toContain('Admin Static: /admin/watch/');

    const meRes = await worker.fetch(
      new Request('https://sondri.ai/api/admin/me', {
        headers: { Cookie: `foo=bar; CF_Authorization=${encodeURIComponent(jwt)}` },
      }),
      env,
    );
    expect(meRes.status).toBe(200);
    const meJson = (await meRes.json()) as any;
    expect(meJson.success).toBe(true);
    expect(meJson.data).toEqual({ email: 'ZEE@SONDRI.AI', mode: 'cloudflare_access' });
  });

  it('ignores LOCAL_DEV_BYPASS_ACCESS on production hostnames and honors it only on localhost', async () => {
    const env = makeBaseEnv({
      CF_ACCESS_TEAM_DOMAIN: undefined,
      CF_ACCESS_AUD: undefined,
      LOCAL_DEV_BYPASS_ACCESS: 'true',
    });

    const prodAttempt = await worker.fetch(new Request('https://sondri.ai/api/admin/me'), env);
    expect(prodAttempt.status).toBe(503);

    const localAttempt = await worker.fetch(new Request('http://localhost:8788/api/admin/me'), env);
    expect(localAttempt.status).toBe(200);
    const json = (await localAttempt.json()) as any;
    expect(json.data.mode).toBe('local_dev');
  });

  it('blocks /api/admin/* and redirects /admin/* when requested on watch.sondri.ai', async () => {
    const env = makeBaseEnv();
    const pageRes = await worker.fetch(new Request('https://watch.sondri.ai/admin/watch/'), env);
    expect(pageRes.status).toBe(302);
    expect(pageRes.headers.get('Location')).toBe('https://sondri.ai/admin/watch/');

    const apiRes = await worker.fetch(new Request('https://watch.sondri.ai/api/admin/orders'), env);
    expect(apiRes.status).toBe(403);
  });

  it('proxies allowlisted admin APIs with server-side X-API-Key and rejects unknown routes/methods', async () => {
    const upstreamCalls: Array<{ url: string; method: string; key: string | null; body: string | null }> = [];
    const env = makeBaseEnv({
      BILLING_SERVICE: {
        fetch: async (input, init) => {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
          const headers = new Headers(init?.headers);
          upstreamCalls.push({
            url,
            method: init?.method || 'GET',
            key: headers.get('X-API-Key'),
            body: typeof init?.body === 'string' ? init.body : null,
          });
          return Response.json({ success: true, data: { ok: true } });
        },
      },
    });
    const now = Math.floor(Date.now() / 1000);
    const jwt = await signJwt({
      iss: `https://${TEAM_DOMAIN}`,
      aud: AUD_TAG,
      exp: now + 300,
      email: 'ops@sondri.ai',
    });

    const ordersRes = await worker.fetch(
      new Request('https://sondri.ai/api/admin/orders?status=paid&limit=50', {
        headers: { 'Cf-Access-Jwt-Assertion': jwt },
      }),
      env,
    );
    expect(ordersRes.status).toBe(200);
    expect(ordersRes.headers.get('Cache-Control')).toBe('private, no-store');
    expect(upstreamCalls[0]).toEqual({
      url: 'https://billing.sondri.ai/admin/orders?status=paid&limit=50',
      method: 'GET',
      key: 'super_secret_worker_key',
      body: null,
    });

    const portalRes = await worker.fetch(
      new Request('https://sondri.ai/api/admin/customers/cus_abc_123/portal', {
        method: 'POST',
        headers: {
          'Cf-Access-Jwt-Assertion': jwt,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ return_url: 'https://sondri.ai/watch/' }),
      }),
      env,
    );
    expect(portalRes.status).toBe(200);
    expect(upstreamCalls[1]).toEqual({
      url: 'https://billing.sondri.ai/customers/cus_abc_123/portal',
      method: 'POST',
      key: 'super_secret_worker_key',
      body: JSON.stringify({ return_url: 'https://sondri.ai/watch/' }),
    });

    const badRoute = await handleAdminApiProxy(
      new Request('https://sondri.ai/api/admin/customers/cus_123/charges', { method: 'POST' }),
      env,
      { email: 'ops@sondri.ai', mode: 'cloudflare_access' },
    );
    expect(badRoute.status).toBe(404);

    const badMethod = await handleAdminApiProxy(
      new Request('https://sondri.ai/api/admin/orders', { method: 'DELETE' }),
      env,
      { email: 'ops@sondri.ai', mode: 'cloudflare_access' },
    );
    expect(badMethod.status).toBe(405);
  });

  it('fails closed with 503 when CF_ACCESS_ALLOWED_EMAILS is unset or blank and rejects email-less JWTs', async () => {
    const now = Math.floor(Date.now() / 1000);
    const validJwt = await signJwt({
      iss: `https://${TEAM_DOMAIN}`,
      aud: [AUD_TAG],
      exp: now + 300,
      email: 'stranger@example.com',
    });

    for (const emptyVal of [undefined, '', '   ', ', ,']) {
      const env = makeBaseEnv({ CF_ACCESS_ALLOWED_EMAILS: emptyVal });
      const res = await worker.fetch(
        new Request('https://sondri.ai/api/admin/orders', {
          headers: { 'Cf-Access-Jwt-Assertion': validJwt },
        }),
        env,
      );
      expect(res.status).toBe(503);
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'none'");
    }

    const emailLessJwt = await signJwt({
      iss: `https://${TEAM_DOMAIN}`,
      aud: [AUD_TAG],
      exp: now + 300,
      sub: 'service-token-123',
    });
    const env = makeBaseEnv();
    const res = await worker.fetch(
      new Request('https://sondri.ai/api/admin/me', {
        headers: { 'Cf-Access-Jwt-Assertion': emailLessJwt },
      }),
      env,
    );
    expect(res.status).toBe(403);
  });

  it('collapses leading slashes and blocks protocol-relative open redirects and //admin bypasses', async () => {
    const env = makeBaseEnv();

    const redirectCases = [
      {
        input: 'https://www.sondri.ai//evil.example/phish?x=1',
        expected: 'https://sondri.ai/evil.example/phish?x=1',
      },
      {
        input: 'https://www.sondri.ai///evil.example/',
        expected: 'https://sondri.ai/evil.example/',
      },
      {
        input: 'https://www.sondri.ai/\\evil.example/',
        expected: 'https://sondri.ai/evil.example/',
      },
      {
        input: 'http://sondri.ai//evil.example/',
        expected: 'https://sondri.ai/evil.example/',
      },
    ];

    for (const tc of redirectCases) {
      const res = await worker.fetch(new Request(tc.input), env);
      expect(res.status).toBe(301);
      expect(res.headers.get('Location')).toBe(tc.expected);
    }

    const doubleSlashAdminPage = await worker.fetch(new Request('https://sondri.ai//admin/watch/'), env);
    expect(doubleSlashAdminPage.status).toBe(401);

    const doubleSlashAdminApi = await worker.fetch(new Request('https://sondri.ai//api/admin/orders'), env);
    expect(doubleSlashAdminApi.status).toBe(401);
  });
});
