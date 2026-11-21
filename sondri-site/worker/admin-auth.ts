export interface AssetsBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface FetcherBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface Env {
  ASSETS: AssetsBinding;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  CF_ACCESS_ALLOWED_EMAILS?: string;
  BILLING_API_KEY?: string;
  BILLING_API_URL?: string;
  BILLING_SERVICE?: FetcherBinding;
  LOCAL_DEV_BYPASS_ACCESS?: string;
}

export type AdminAuthResult =
  | { ok: true; email: string; mode: 'cloudflare_access' | 'local_dev' }
  | { ok: false; status: 401 | 403 | 503; code: string; message: string };

interface JsonWebKeyWithKid extends JsonWebKey {
  kid?: string;
  kty?: string;
}

interface JwksCacheEntry {
  fetchedAt: number;
  keys: JsonWebKeyWithKid[];
}

const JWKS_TTL_MS = 10 * 60 * 1000;
const CLOCK_SKEW_SEC = 30;
const jwksCache = new Map<string, JwksCacheEntry>();

export function clearJwksCache(): void {
  jwksCache.clear();
}

export function withPrivateSecurityHeaders(
  res: Response,
  opts: { contentType?: string } = {},
): Response {
  const headers = new Headers(res.headers);
  if (opts.contentType) {
    headers.set('Content-Type', opts.contentType);
  }
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Content-Security-Policy', "frame-ancestors 'none'");
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export function normalizeAccessIssuer(teamDomain: string): string {
  const cleanHost = teamDomain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  return `https://${cleanHost}`;
}

function base64UrlToUint8Array(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64UrlJson<T>(segment: string): T {
  const bytes = base64UrlToUint8Array(segment);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as T;
}

function extractAccessToken(request: Request): string | null {
  const headerToken = request.headers.get('Cf-Access-Jwt-Assertion')?.trim();
  if (headerToken) return headerToken;

  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const name = part.slice(0, eqIdx).trim();
    if (name !== 'CF_Authorization') continue;
    const rawVal = part.slice(eqIdx + 1).trim();
    if (!rawVal) return null;
    try {
      return decodeURIComponent(rawVal);
    } catch {
      return rawVal;
    }
  }
  return null;
}

async function fetchJwks(
  certsUrl: string,
  fetchFn: typeof fetch,
  forceRefresh = false,
): Promise<JsonWebKeyWithKid[]> {
  const now = Date.now();
  const cached = jwksCache.get(certsUrl);
  if (!forceRefresh && cached && now - cached.fetchedAt < JWKS_TTL_MS) {
    return cached.keys;
  }

  const res = await fetchFn(certsUrl, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`JWKS fetch failed (${res.status})`);
  }

  const data = (await res.json()) as { keys?: JsonWebKeyWithKid[] };
  const keys = Array.isArray(data?.keys) ? data.keys : [];
  jwksCache.set(certsUrl, { fetchedAt: now, keys });
  return keys;
}

async function findVerificationKey(
  certsUrl: string,
  kid: string,
  fetchFn: typeof fetch,
): Promise<JsonWebKeyWithKid> {
  const isMatch = (k: JsonWebKeyWithKid) => k.kid === kid && (!k.kty || k.kty === 'RSA');

  const keys = await fetchJwks(certsUrl, fetchFn, false);
  const found = keys.find(isMatch);
  if (found) return found;

  // Key rotation fallback: bypass cache once before rejecting an unknown kid.
  const refreshed = await fetchJwks(certsUrl, fetchFn, true);
  const foundAfterRefresh = refreshed.find(isMatch);
  if (!foundAfterRefresh) {
    throw new Error('UNKNOWN_KID');
  }
  return foundAfterRefresh;
}

export async function verifyCloudflareAccessJwt(
  token: string,
  env: Env,
  fetchFn: typeof fetch = fetch,
): Promise<{ email: string; sub: string }> {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error('MALFORMED_JWT');
  }

  const [headerB64, payloadB64, sigB64] = parts;
  const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(headerB64);
  if (header?.alg !== 'RS256' || typeof header?.kid !== 'string' || !header.kid.trim()) {
    throw new Error('INVALID_JWT_HEADER');
  }

  const payload = decodeBase64UrlJson<{
    iss?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    email?: string;
    sub?: string;
  }>(payloadB64);

  const expectedIss = normalizeAccessIssuer(env.CF_ACCESS_TEAM_DOMAIN || '');
  const tokenIss = typeof payload?.iss === 'string' ? payload.iss.replace(/\/+$/, '') : '';
  if (!tokenIss || tokenIss !== expectedIss) {
    throw new Error('INVALID_ISSUER');
  }

  const expectedAud = env.CF_ACCESS_AUD?.trim() || '';
  const audValid =
    typeof payload?.aud === 'string'
      ? payload.aud === expectedAud
      : Array.isArray(payload?.aud) && payload.aud.includes(expectedAud);
  if (!expectedAud || !audValid) {
    throw new Error('INVALID_AUDIENCE');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload?.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('TOKEN_EXPIRED');
  }
  if (typeof payload?.nbf === 'number' && payload.nbf > nowSec + CLOCK_SKEW_SEC) {
    throw new Error('TOKEN_NOT_ACTIVE');
  }

  const certsUrl = `${expectedIss}/cdn-cgi/access/certs`;
  const jwk = await findVerificationKey(certsUrl, header.kid, fetchFn);
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signedBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signatureBytes = base64UrlToUint8Array(sigB64);
  const verified = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    cryptoKey,
    signatureBytes,
    signedBytes,
  );
  if (!verified) {
    throw new Error('INVALID_SIGNATURE');
  }

  return {
    email: typeof payload.email === 'string' ? payload.email : '',
    sub: typeof payload.sub === 'string' ? payload.sub : '',
  };
}

export async function authorizeAdminRequest(
  request: Request,
  env: Env,
  fetchFn: typeof fetch = fetch,
): Promise<AdminAuthResult> {
  const hostname = new URL(request.url).hostname.toLowerCase();
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocalhost && env.LOCAL_DEV_BYPASS_ACCESS === 'true') {
    return { ok: true, email: 'local-dev@localhost', mode: 'local_dev' };
  }

  const allowedSet = new Set(
    (env.CF_ACCESS_ALLOWED_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!env.CF_ACCESS_TEAM_DOMAIN?.trim() || !env.CF_ACCESS_AUD?.trim() || allowedSet.size === 0) {
    return {
      ok: false,
      status: 503,
      code: 'ACCESS_NOT_CONFIGURED',
      message: 'Cloudflare Access is not configured on this Worker.',
    };
  }

  const token = extractAccessToken(request);
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'ACCESS_TOKEN_MISSING',
      message: 'Cloudflare Access authentication is required.',
    };
  }

  let verified: { email: string; sub: string };
  try {
    verified = await verifyCloudflareAccessJwt(token, env, fetchFn);
  } catch {
    return {
      ok: false,
      status: 401,
      code: 'ACCESS_TOKEN_INVALID',
      message: 'Invalid or expired Cloudflare Access session.',
    };
  }

  const emailLower = verified.email.trim().toLowerCase();
  if (!emailLower || !allowedSet.has(emailLower)) {
    return {
      ok: false,
      status: 403,
      code: 'ACCESS_FORBIDDEN',
      message: 'Your account is not permitted to access Sondri billing admin.',
    };
  }

  return {
    ok: true,
    email: verified.email.trim(),
    mode: 'cloudflare_access',
  };
}

function resolveUpstreamRoute(
  pathname: string,
  search: string,
  method: string,
): { ok: true; upstreamPath: string; method: 'GET' | 'POST' } | { ok: false; status: 404 | 405; code: string; message: string } {
  if (pathname === '/api/admin/orders') {
    if (method !== 'GET') {
      return { ok: false, status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' };
    }
    return { ok: true, upstreamPath: `/admin/orders${search}`, method: 'GET' };
  }

  if (pathname === '/api/admin/subscriptions') {
    if (method !== 'GET') {
      return { ok: false, status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' };
    }
    return { ok: true, upstreamPath: `/admin/subscriptions${search}`, method: 'GET' };
  }

  if (pathname === '/api/admin/customers') {
    if (method !== 'GET') {
      return { ok: false, status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' };
    }
    return { ok: true, upstreamPath: `/admin/customers${search}`, method: 'GET' };
  }

  const portalMatch = pathname.match(/^\/api\/admin\/customers\/([a-zA-Z0-9_-]+)\/portal$/);
  if (portalMatch) {
    if (method !== 'POST') {
      return { ok: false, status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' };
    }
    return {
      ok: true,
      upstreamPath: `/customers/${encodeURIComponent(portalMatch[1])}/portal`,
      method: 'POST',
    };
  }

  return { ok: false, status: 404, code: 'NOT_FOUND', message: `Unknown admin route: ${pathname}` };
}

export async function handleAdminApiProxy(
  request: Request,
  env: Env,
  auth: { email: string; mode: 'cloudflare_access' | 'local_dev' },
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (url.pathname === '/api/admin/me') {
    if (method !== 'GET') {
      return withPrivateSecurityHeaders(
        Response.json(
          { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } },
          { status: 405 },
        ),
      );
    }
    return withPrivateSecurityHeaders(
      Response.json({
        success: true,
        data: { email: auth.email, mode: auth.mode },
      }),
    );
  }

  const route = resolveUpstreamRoute(url.pathname, url.search, method);
  if (!route.ok) {
    return withPrivateSecurityHeaders(
      Response.json(
        { success: false, error: { code: route.code, message: route.message } },
        { status: route.status },
      ),
    );
  }

  const billingKey = env.BILLING_API_KEY?.trim();
  if (!billingKey) {
    return withPrivateSecurityHeaders(
      Response.json(
        {
          success: false,
          error: {
            code: 'BILLING_API_KEY_NOT_CONFIGURED',
            message: 'BILLING_API_KEY secret is not configured on the site Worker.',
          },
        },
        { status: 503 },
      ),
    );
  }

  const baseUrl = (env.BILLING_API_URL || 'https://billing.sondri.ai').replace(/\/+$/, '');
  const targetUrl = `${baseUrl}${route.upstreamPath}`;
  const headers = new Headers({
    'X-API-Key': billingKey,
    Accept: 'application/json',
  });

  let bodyText: string | undefined;
  if (route.method === 'POST') {
    headers.set('Content-Type', 'application/json');
    bodyText = await request.text();
  }

  try {
    const upstreamInit: RequestInit = {
      method: route.method,
      headers,
      ...(bodyText !== undefined ? { body: bodyText } : {}),
    };
    const upstreamRes = env.BILLING_SERVICE
      ? await env.BILLING_SERVICE.fetch(targetUrl, upstreamInit)
      : await fetchFn(targetUrl, upstreamInit);

    const text = await upstreamRes.text();
    const contentType = upstreamRes.headers.get('Content-Type') || 'application/json; charset=utf-8';
    return withPrivateSecurityHeaders(
      new Response(text, {
        status: upstreamRes.status,
        headers: { 'Content-Type': contentType },
      }),
    );
  } catch (err: any) {
    return withPrivateSecurityHeaders(
      Response.json(
        {
          success: false,
          error: {
            code: 'UPSTREAM_UNREACHABLE',
            message: err?.message || 'Unable to reach billing-worker.',
          },
        },
        { status: 502 },
      ),
    );
  }
}
