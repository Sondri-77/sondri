import { describe, it, expect } from 'vitest';
import worker from '../src/index';
import { Env } from '../src/types';

const mockEnv: Env = {
  STRIPE_SECRET_KEY: 'sk_test_mock_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_mock_123',
  API_KEY: 'test_api_key_123',
  DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/mock',
  GOOGLE_SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/mock/exec',
};

describe('Billing Worker Webhook & Event Router', () => {
  it('should reject webhook requests missing the stripe-signature header', async () => {
    const req = new Request('http://localhost:8787/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const ctx = {} as ExecutionContext;
    const res = await worker.fetch(req, mockEnv, ctx);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain('Missing stripe-signature header');
  });

  it('should reject webhooks if STRIPE_WEBHOOK_SECRET is missing', async () => {
    const req = new Request('http://localhost:8787/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 't=123,v1=fake' },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const envWithoutSecret = { ...mockEnv, STRIPE_WEBHOOK_SECRET: '' };
    const ctx = {} as ExecutionContext;
    const res = await worker.fetch(req, envWithoutSecret, ctx);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Webhook secret missing');
  });
});
