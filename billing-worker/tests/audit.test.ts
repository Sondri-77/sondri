import { beforeEach, describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import {
  getAuditById,
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
});
