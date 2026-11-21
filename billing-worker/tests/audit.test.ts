import { beforeEach, describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import {
  getAuditById,
  getCachedAuditByDomain,
  resetMemoryAuditStore,
  saveAuditStep1,
  StoredAudit,
  updateAuditFullBaseline,
} from '../src/lib/db';
import { Env } from '../src/types';
import { normalizeInputUrl, stripTags } from '../src/lib/scanner';

const mockEnv: Env = {
  STRIPE_SECRET_KEY: 'sk_test_mock_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_mock_123',
  API_KEY: 'test_api_key_123',
};

describe('AEO Mini Audit API & Security Guards', () => {
  beforeEach(() => {
    resetMemoryAuditStore();
    vi.restoreAllMocks();
  });

  it('normalizes public domains and blocks localhost/private SSRF targets', () => {
    const valid = normalizeInputUrl('www.sondri.ai');
    expect(valid.domain).toBe('sondri.ai');
    expect(valid.origin).toBe('https://www.sondri.ai');

    expect(() => normalizeInputUrl('http://localhost:3000')).toThrow();
    expect(() => normalizeInputUrl('http://127.0.0.1/admin')).toThrow();
    expect(() => normalizeInputUrl('http://192.168.1.1')).toThrow();
  });

  it('rejects invalid URLs on POST /audit/scan with 400', async () => {
    const req = new Request('http://localhost:8787/audit/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://127.0.0.1:8080', lang: 'en' }),
    });
    const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;
    const res = await worker.fetch(req, mockEnv, ctx);
    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_URL');
  });

  it('rejects disposable emails on POST /audit/ai-visibility', async () => {
    const req = new Request('http://localhost:8787/audit/ai-visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audit_id: 'aud_12345',
        email: 'bot@mailinator.com',
      }),
    });
    const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;
    const res = await worker.fetch(req, mockEnv, ctx);
    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_EMAIL');
  });

  it('strips unclosed HTML tags and angle brackets in stripTags()', () => {
    expect(stripTags('Acme <img src=x onerror=alert(1)')).toBe('Acme');
    expect(stripTags('Hello <script>alert(1)')).toBe('Hello');
    expect(stripTags('Test > < svg onload=x')).not.toMatch(/[<>]/);
  });

  it('isolates caller audit IDs and strips full_audit/ai_visibility on 7-day domain cache hits and GET /audit/:id', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const past = new Date(now.getTime() - 60 * 1000).toISOString();

    const legitAudit: StoredAudit = {
      id: 'aud_victim_paid_1',
      domain: 'clinic-example.com',
      url: 'https://clinic-example.com/',
      lang: 'en',
      city: 'United States',
      service: 'Dental Implants',
      tech_scan: {
        url: 'https://clinic-example.com/',
        domain: 'clinic-example.com',
        reachable: true,
        statusCode: 200,
        title: 'Clinic Example',
        metaDescription: 'Dental Implants',
        canonical: 'https://clinic-example.com/',
        h1s: ['Dental Implants'],
        h2s: [],
        detectedBrand: 'Clinic Example',
        inferredService: 'Dental Implants',
        inferredCity: 'United States',
        schemasFound: ['Dentist'],
        hasOrganizationOrLocalBusiness: true,
        hasFaqSchema: false,
        hasPhoneInHtml: true,
        hasAddressSignals: true,
        robotsTxtFound: true,
        bots: [],
        llmsTxtFound: false,
        sitemapFound: true,
        readinessScore: 35,
        gaps: [],
      },
      lighthouse: null,
      questions: ['Best dental implants clinic?'],
      ai_visibility: {
        ranAt: now.toISOString(),
        engine: 'gemini',
        totalQuestions: 1,
        namedCount: 1,
        citedCount: 1,
        competitorsSummary: ['Other Dentist'],
        topSourceDomains: ['clinic-example.com'],
        runs: [
          {
            question: 'Best dental implants clinic?',
            engine: 'gemini',
            status: 'ok',
            brandNamed: true,
            domainCited: true,
            competitorsNamed: ['Other Dentist'],
            sourcesCited: [{ title: 'Clinic', url: 'https://clinic-example.com', domain: 'clinic-example.com' }],
            answerExcerpt: 'Clinic Example is listed.',
          },
        ],
        enginesNotRun: [],
      },
      full_audit: null,
      created_at: new Date(now.getTime() - 10000).toISOString(),
      expires_at: future,
    };

    await saveAuditStep1(mockEnv, legitAudit);
    await updateAuditFullBaseline(mockEnv, legitAudit.id, {
      ...legitAudit.ai_visibility!,
      totalQuestions: 12,
    });

    // Poisoned custom submission created more recently under same default city
    const attackerAudit: StoredAudit = {
      ...legitAudit,
      id: 'aud_attacker_poison',
      service: 'Attacker Custom Service',
      questions: ['<img src=x onerror=alert(1)>'],
      ai_visibility: {
        ...legitAudit.ai_visibility!,
        customInput: true,
      },
      full_audit: null,
      created_at: now.toISOString(),
      expires_at: future,
    };
    await saveAuditStep1(mockEnv, attackerAudit);

    const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;
    const scanRes = await worker.fetch(
      new Request('http://localhost:8787/audit/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://clinic-example.com', lang: 'en' }),
      }),
      mockEnv,
      ctx
    );
    expect(scanRes.status).toBe(200);
    const scanJson: any = await scanRes.json();
    expect(scanJson.data.cached).toBe(true);
    expect(scanJson.data.id).not.toBe('aud_victim_paid_1');
    expect(scanJson.data.id).not.toBe('aud_attacker_poison');
    expect(scanJson.data.service).toBe('Dental Implants');
    expect(scanJson.data.questions).toEqual(['Best dental implants clinic?']);
    expect(scanJson.data.ai_visibility).toBeNull();
    expect(scanJson.data.full_audit).toBeNull();

    // Direct GET /audit/:id also strips paid full_audit and blocks expired rows
    const getRes = await worker.fetch(
      new Request(`http://localhost:8787/audit/${legitAudit.id}`),
      mockEnv,
      ctx
    );
    expect(getRes.status).toBe(200);
    const getJson: any = await getRes.json();
    expect(getJson.data.full_audit).toBeNull();

    await saveAuditStep1(mockEnv, {
      ...legitAudit,
      id: 'aud_expired_row',
      expires_at: past,
    });
    const expRes = await worker.fetch(
      new Request('http://localhost:8787/audit/aud_expired_row'),
      mockEnv,
      ctx
    );
    expect(expRes.status).toBe(404);
    expect(await getAuditById(mockEnv, scanJson.data.id)).not.toBeNull();
  });

  it('fails closed when DAILY_AUDIT_CAP=0, ignores unauthenticated force:true, and enforces per-IP limits without X-Forwarded-For spoofing', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (u.startsWith('https://generativelanguage.googleapis.com/')) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        city: 'United States',
                        service: 'Plumbing',
                        questions: ['q1', 'q2', 'q3'],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (u.startsWith('https://pagespeedonline.googleapis.com/')) {
        return new Response(
          JSON.stringify({ lighthouseResult: { categories: { seo: { score: 0.9 }, performance: { score: 0.85 } }, audits: {} } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('<html><title>Test Co</title><h1>Plumbing</h1></html>', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;
    const capZeroEnv: Env = { ...mockEnv, DAILY_AUDIT_CAP: '0', GEMINI_API_KEY: 'gm_test' };

    const blockedScan = await worker.fetch(
      new Request('https://billing.sondri.ai/audit/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.10' },
        body: JSON.stringify({ url: 'https://testco.example', lang: 'en' }),
      }),
      capZeroEnv,
      ctx
    );
    expect(blockedScan.status).toBe(429);

    const blockedLh = await worker.fetch(
      new Request('https://billing.sondri.ai/audit/lighthouse?url=https://testco.example', {
        headers: { 'CF-Connecting-IP': '198.51.100.10' },
      }),
      capZeroEnv,
      ctx
    );
    expect(blockedLh.status).toBe(429);

    // Seed a cached audit to verify unauthenticated force:true does not bypass cache
    const now = new Date();
    const cachedRow: StoredAudit = {
      id: 'aud_cached_force_check',
      domain: 'cachedco.example',
      url: 'https://cachedco.example/',
      lang: 'en',
      city: 'United States',
      service: 'SaaS',
      tech_scan: {
        url: 'https://cachedco.example/',
        domain: 'cachedco.example',
        reachable: true,
        statusCode: 200,
        title: 'CachedCo',
        metaDescription: 'SaaS',
        canonical: 'https://cachedco.example/',
        h1s: ['CachedCo'],
        h2s: [],
        detectedBrand: 'CachedCo',
        inferredService: 'SaaS',
        inferredCity: 'United States',
        schemasFound: [],
        hasOrganizationOrLocalBusiness: false,
        hasFaqSchema: false,
        hasPhoneInHtml: false,
        hasAddressSignals: false,
        robotsTxtFound: true,
        bots: [],
        llmsTxtFound: false,
        sitemapFound: false,
        readinessScore: 20,
        gaps: [],
      },
      lighthouse: null,
      questions: ['Best SaaS?'],
      ai_visibility: {
        ranAt: now.toISOString(),
        engine: 'gemini',
        totalQuestions: 1,
        namedCount: 1,
        citedCount: 1,
        competitorsSummary: [],
        topSourceDomains: [],
        runs: [
          {
            question: 'Best SaaS?',
            engine: 'gemini',
            status: 'ok',
            brandNamed: true,
            domainCited: true,
            competitorsNamed: [],
            sourcesCited: [],
            answerExcerpt: 'ok',
          },
        ],
        enginesNotRun: [],
      },
      full_audit: null,
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 86400000).toISOString(),
    };
    await saveAuditStep1(mockEnv, cachedRow);

    const unauthForceRes = await worker.fetch(
      new Request('https://billing.sondri.ai/audit/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.11' },
        body: JSON.stringify({ url: 'https://cachedco.example', force: true }),
      }),
      capZeroEnv,
      ctx
    );
    expect(unauthForceRes.status).toBe(200);
    expect(((await unauthForceRes.json()) as any).data.cached).toBe(true);

    // X-Forwarded-For: 127.0.0.1 on billing.sondri.ai must NOT grant 1000/day localhost allowance
    const leadSpamEnv: Env = {
      ...mockEnv,
      DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/mock',
      DAILY_AUDIT_CAP: '0',
    };
    for (let i = 0; i < 3; i++) {
      const okQueued = await worker.fetch(
        new Request('https://billing.sondri.ai/audit/ai-visibility', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': '127.0.0.1',
          },
          body: JSON.stringify({
            audit_id: cachedRow.id,
            name: 'User',
            email: `user${i}@company.com`,
            questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
          }),
        }),
        leadSpamEnv,
        ctx
      );
      expect(okQueued.status).toBe(200);
      const bodyJson: any = await okQueued.json();
      expect(bodyJson.data.questions.length).toBe(3);
    }

    const callsBeforeLimit = fetchMock.mock.calls.length;
    const fourthBlocked = await worker.fetch(
      new Request('https://billing.sondri.ai/audit/ai-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '127.0.0.1',
        },
        body: JSON.stringify({
          audit_id: cachedRow.id,
          name: 'User',
          email: 'user4@company.com',
          questions: ['Q1'],
        }),
      }),
      leadSpamEnv,
      ctx
    );
    expect(fourthBlocked.status).toBe(429);
    expect(fetchMock.mock.calls.length).toBe(callsBeforeLimit);
  });

  it('keeps valid 7-day cached audits retrievable even after >10 Step-1-only scans (memory and D1)', async () => {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const validAudit: StoredAudit = {
      id: 'aud_valid_cached_row',
      domain: 'repeatcache.example',
      url: 'https://repeatcache.example/',
      lang: 'en',
      city: 'United States',
      service: 'SaaS',
      tech_scan: {
        url: 'https://repeatcache.example/',
        domain: 'repeatcache.example',
        reachable: true,
        statusCode: 200,
        title: 'RepeatCache',
        metaDescription: 'SaaS',
        canonical: 'https://repeatcache.example/',
        h1s: ['RepeatCache'],
        h2s: [],
        wordCount: 400,
        schemaTypes: ['Organization'],
        hasOrgSchema: true,
        hasFaqSchema: true,
        hasServiceSchema: false,
        hasLocalBusinessSchema: false,
        hasArticleSchema: false,
        hasLlmsTxt: true,
        hasLlmsFullTxt: false,
        sitemapFound: true,
        robotsFound: true,
        aiBots: [],
        detectedBrand: 'RepeatCache',
        inferredService: 'SaaS',
        inferredCity: 'United States',
        readinessScore: 78,
        gaps: [],
      },
      lighthouse: null,
      questions: ['Best SaaS?'],
      ai_visibility: {
        ranAt: '2026-11-21T00:00:00.000Z',
        engine: 'gemini',
        namedCount: 1,
        citedCount: 1,
        totalQuestions: 1,
        competitorsSummary: [],
        topSourceDomains: ['repeatcache.example'],
        runs: [
          {
            question: 'Best SaaS?',
            brandNamed: true,
            domainCited: true,
            answerExcerpt: 'RepeatCache is recommended.',
            competitorsNamed: [],
            sourcesCited: [],
            status: 'ok',
          },
        ],
        enginesNotRun: [],
      },
      full_audit: null,
      created_at: '2026-11-21T00:00:00.000Z',
      expires_at: expires,
    };

    // 1. Memory store: valid audit followed by 12 newer Step-1-only (ai_visibility: null) scans
    await saveAuditStep1(mockEnv, validAudit);
    for (let i = 1; i <= 12; i++) {
      await saveAuditStep1(mockEnv, {
        ...validAudit,
        id: `aud_step1_only_${i}`,
        ai_visibility: null,
        created_at: `2026-11-21T00:${String(i).padStart(2, '0')}:00.000Z`,
      });
    }

    const memHit = await getCachedAuditByDomain(mockEnv, 'repeatcache.example', 'en');
    expect(memHit?.id).toBe('aud_valid_cached_row');

    // 2. D1 SQLite path: enforce ai_visibility_json IS NOT NULL so Step-1 rows cannot crowd out LIMIT 10
    const d1Rows: Record<string, any>[] = [
      {
        id: validAudit.id,
        domain: validAudit.domain,
        url: validAudit.url,
        lang: validAudit.lang,
        city: validAudit.city,
        service: validAudit.service,
        tech_scan_json: JSON.stringify(validAudit.tech_scan),
        lighthouse_json: null,
        questions_json: JSON.stringify(validAudit.questions),
        ai_visibility_json: JSON.stringify(validAudit.ai_visibility),
        full_audit_json: null,
        created_at: validAudit.created_at,
        expires_at: validAudit.expires_at,
      },
      ...Array.from({ length: 12 }, (_, idx) => ({
        id: `aud_d1_step1_${idx + 1}`,
        domain: validAudit.domain,
        url: validAudit.url,
        lang: validAudit.lang,
        city: validAudit.city,
        service: validAudit.service,
        tech_scan_json: JSON.stringify(validAudit.tech_scan),
        lighthouse_json: null,
        questions_json: JSON.stringify(validAudit.questions),
        ai_visibility_json: null,
        full_audit_json: null,
        created_at: `2026-11-21T01:${String(idx + 1).padStart(2, '0')}:00.000Z`,
        expires_at: validAudit.expires_at,
      })),
    ];

    const capturedSql: string[] = [];
    const mockDb = {
      prepare(sql: string) {
        capturedSql.push(sql);
        const makeExec = (boundArgs: any[]) => ({
          async run() {
            return { success: true, meta: { changes: 0 } };
          },
          async first() {
            return null;
          },
          async all() {
            if (sql.includes('FROM audits') && sql.includes('LIMIT 10')) {
              const [qDomain, qLang, qCity, qNow] = boundArgs;
              const requiresAi = sql.toLowerCase().includes('ai_visibility_json is not null');
              const results = d1Rows
                .filter(
                  (r) =>
                    r.domain === qDomain &&
                    r.lang === qLang &&
                    r.city === qCity &&
                    r.expires_at > qNow &&
                    (!requiresAi || r.ai_visibility_json !== null)
                )
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .slice(0, 10);
              return { success: true, results };
            }
            return { success: true, results: [] };
          },
        });
        return {
          ...makeExec([]),
          bind(...args: any[]) {
            return makeExec(args);
          },
        };
      },
      async batch() {
        return [];
      },
    } as unknown as D1Database;

    const d1Env: Env = { ...mockEnv, DB: mockDb };
    const d1Hit = await getCachedAuditByDomain(d1Env, 'repeatcache.example', 'en');
    expect(d1Hit?.id).toBe('aud_valid_cached_row');
    expect(
      capturedSql.some((s) => s.includes('FROM audits') && s.includes('ai_visibility_json IS NOT NULL'))
    ).toBe(true);
  });
});
