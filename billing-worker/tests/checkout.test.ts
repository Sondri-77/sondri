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
    const json: any = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain('Must provide a valid positive custom_amount');
  });

  it('should reject unknown watch_offer SKUs with 400', async () => {
    const req = new Request('http://localhost:8787/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'watch_offer',
        offer_sku: 'nonexistent_tier',
      }),
    });

    const ctx = {} as ExecutionContext;
    const res = await worker.fetch(req, mockEnv, ctx);

    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_OFFER_SKU');
  });

  it('should create Stripe Checkout payloads for one-time Sprints and recurring Watch subscriptions without subscription invoice errors', async () => {
    const createMock = vi.fn().mockResolvedValue({
      id: 'cs_test_watch_123',
      url: 'https://checkout.stripe.com/pay/cs_test_watch_123',
    });

    const stripeMod = await import('../src/lib/stripe');
    const spy = vi.spyOn(stripeMod, 'getStripe').mockReturnValue({
      checkout: { sessions: { create: createMock } },
    } as any);

    try {
      // 1. One-time AI Listings Sprint ($249)
      const resSprint = await worker.fetch(
        new Request('http://localhost:8787/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'watch_offer',
            offer_sku: 'listings_sprint',
            domain: 'clinica.cl',
            client_email: 'owner@clinica.cl',
            lang: 'es',
          }),
        }),
        mockEnv,
        {} as ExecutionContext
      );
      expect(resSprint.status).toBe(200);
      const sprintCall = createMock.mock.calls[0][0];
      expect(sprintCall.mode).toBe('payment');
      expect(sprintCall.line_items[0].price_data.unit_amount).toBe(24900);
      expect(sprintCall.invoice_creation.enabled).toBe(true);
      expect(sprintCall.metadata.offer_sku).toBe('listings_sprint');

      // 2. Recurring Watch Local ($149/mo) — must NOT include invoice_creation or payment_intent_data
      const resWatch = await worker.fetch(
        new Request('http://localhost:8787/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'watch_offer',
            offer_sku: 'watch_local',
            domain: 'clinica.cl',
            client_email: 'owner@clinica.cl',
            lang: 'en',
          }),
        }),
        mockEnv,
        {} as ExecutionContext
      );
      expect(resWatch.status).toBe(200);
      const watchCall = createMock.mock.calls[1][0];
      expect(watchCall.mode).toBe('subscription');
      expect(watchCall.line_items[0].price_data.unit_amount).toBe(14900);
      expect(watchCall.line_items[0].price_data.recurring).toEqual({ interval: 'month' });
      expect(watchCall.invoice_creation).toBeUndefined();
      expect(watchCall.payment_intent_data).toBeUndefined();
      expect(watchCall.subscription_data.metadata.offer_sku).toBe('watch_local');

      // 3. Portfolio Snapshot ($1,500)
      const resPortfolio = await worker.fetch(
        new Request('http://localhost:8787/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'watch_offer',
            offer_sku: 'portfolio_snapshot',
          }),
        }),
        mockEnv,
        {} as ExecutionContext
      );
      expect(resPortfolio.status).toBe(200);
      expect(createMock.mock.calls[2][0].line_items[0].price_data.unit_amount).toBe(150000);

      // 4. Website Package SKUs ($390 / $690 / $1,190)
      const websiteCases = [
        { sku: 'website_quick_fix', expectedCents: 39000 },
        { sku: 'website_5page', expectedCents: 69000 },
        { sku: 'website_10page', expectedCents: 119000 },
      ];
      for (const wc of websiteCases) {
        const resSite = await worker.fetch(
          new Request('http://localhost:8787/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'watch_offer',
              offer_sku: wc.sku,
              domain: 'clinic.example.com',
            }),
          }),
          mockEnv,
          {} as ExecutionContext
        );
        expect(resSite.status).toBe(200);
        const call = createMock.mock.calls[createMock.mock.calls.length - 1][0];
        expect(call.mode).toBe('payment');
        expect(call.line_items[0].price_data.unit_amount).toBe(wc.expectedCents);
        expect(call.metadata.offer_sku).toBe(wc.sku);
      }
    } finally {
      spy.mockRestore();
    }
  });
});
