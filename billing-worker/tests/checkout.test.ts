import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import { Env } from '../src/types';

const mockEnv: Env = {
  STRIPE_SECRET_KEY: 'sk_test_mock_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_mock_123',
  API_KEY: 'test_api_key_123',
  DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/mock',
  GOOGLE_SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/mock/exec',
};

describe('Billing Worker Checkout API', () => {
  it('should return CORS headers on OPTIONS preflight request', async () => {
    const req = new Request('http://localhost:8787/create-checkout-session', {
      method: 'OPTIONS',
    });

    const ctx = {} as ExecutionContext;
    const res = await worker.fetch(req, mockEnv, ctx);

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('should reject unauthorized requests to admin API routes', async () => {
    const req = new Request('http://localhost:8787/customers', {
      method: 'GET',
    });

    const ctx = {} as ExecutionContext;
    const res = await worker.fetch(req, mockEnv, ctx);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('should validate custom deposit amount and reject negative or zero values', async () => {
    const req = new Request('http://localhost:8787/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'custom',
        client_email: 'test@company.com',
        custom_amount: 0,
        description: 'Test Deposit',
      }),
    });

    const ctx = {} as ExecutionContext;
    const res = await worker.fetch(req, mockEnv, ctx);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain('Must provide a valid positive custom_amount');
  });
});
