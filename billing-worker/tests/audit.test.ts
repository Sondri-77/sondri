import { describe, it, expect } from 'vitest';
import worker from '../src/index';
import { Env } from '../src/types';
import { normalizeInputUrl } from '../src/lib/scanner';

const mockEnv: Env = {
  STRIPE_SECRET_KEY: 'sk_test_mock_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_mock_123',
  API_KEY: 'test_api_key_123',
};

describe('AEO Mini Audit API & Security Guards', () => {
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
});
