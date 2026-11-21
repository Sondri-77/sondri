import { beforeEach, describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import { getCustomerByEmail, getOrderBySessionId, resetMemoryBillingStore, upsertCustomer } from '../src/lib/db';
import { Env } from '../src/types';

const mockEnv: Env = {
  STRIPE_SECRET_KEY: 'sk_test_mock_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_mock_123',
  API_KEY: 'test_api_key_123',
  DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/mock',
  GOOGLE_SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/mock/exec',
};

describe('Billing Worker Checkout & Admin API', () => {
  beforeEach(() => {
    resetMemoryBillingStore();
    vi.restoreAllMocks();
  });

  it('should return CORS headers on OPTIONS preflight request', async () => {
    const req = new Request('http://localhost:8787/create-checkout-session', {
      method: 'OPTIONS',
    });

    const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Headers')).not.toContain('X-API-Key');
  });

  it('should reject unauthorized requests to admin API routes and omit browser CORS on admin endpoints', async () => {
    for (const path of ['/customers', '/admin/orders', '/admin/subscriptions', '/admin/customers']) {
      const req = new Request(`http://localhost:8787${path}`, { method: 'GET' });
      const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);
      expect(res.status).toBe(401);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
      const json: any = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    }

    const noSecretRes = await worker.fetch(
      new Request('http://localhost:8787/admin/orders', {
        method: 'GET',
        headers: { 'X-API-Key': 'anything' },
      }),
      { ...mockEnv, API_KEY: '' },
      {} as ExecutionContext
    );
    expect(noSecretRes.status).toBe(503);
    expect(noSecretRes.headers.get('Access-Control-Allow-Origin')).toBeNull();
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

    const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);

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

    const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);

    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_OFFER_SKU');
  });

  it('should enforce pre-checkout intake fields (name, email, domain) when required, while allowing optional domain for new website builds', async () => {
    const missingName = await worker.fetch(
      new Request('http://localhost:8787/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'watch_offer',
          offer_sku: 'watch_local',
          client_email: 'owner@clinic.com',
          domain: 'clinic.com',
        }),
      }),
      mockEnv,
      {} as ExecutionContext
    );
    expect(missingName.status).toBe(400);
    expect(((await missingName.json()) as any).error.code).toBe('INVALID_INTAKE');

    const badEmail = await worker.fetch(
      new Request('http://localhost:8787/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'aeo_full_audit',
          client_name: 'Alex Rivera',
          client_email: 'not-an-email',
          domain: 'clinic.com',
        }),
      }),
      mockEnv,
      {} as ExecutionContext
    );
    expect(badEmail.status).toBe(400);
    expect(((await badEmail.json()) as any).error.code).toBe('INVALID_INTAKE');

    const missingDomainForWatch = await worker.fetch(
      new Request('http://localhost:8787/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'watch_offer',
          offer_sku: 'watch_local',
          client_name: 'Alex Rivera',
          client_email: 'alex@clinic.com',
        }),
      }),
      mockEnv,
      {} as ExecutionContext
    );
    expect(missingDomainForWatch.status).toBe(400);
    expect(((await missingDomainForWatch.json()) as any).error.code).toBe('INVALID_INTAKE');

    // website_5page and website_10page allow empty domain for brand-new builds
    const createMock = vi.fn().mockResolvedValue({
      id: 'cs_test_newsite',
      url: 'https://checkout.stripe.com/pay/cs_test_newsite',
    });
    const stripeMod = await import('../src/lib/stripe');
    vi.spyOn(stripeMod, 'getStripe').mockReturnValue({
      checkout: { sessions: { create: createMock } },
    } as any);

    for (const sku of ['website_5page', 'website_10page']) {
      const resNewSite = await worker.fetch(
        new Request('http://localhost:8787/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'watch_offer',
            offer_sku: sku,
            client_name: 'Alex Rivera',
            client_email: 'alex@newbrand.com',
            city: 'Austin, TX',
            service: 'Boutique MedSpa',
          }),
        }),
        mockEnv,
        {} as ExecutionContext
      );
      expect(resNewSite.status).toBe(200);
    }
  });

  it('should create Stripe Checkout payloads safely, persist checkout_started orders, and serve Admin API + Billing Portal', async () => {
    let seq = 0;
    const createSessionMock = vi.fn().mockImplementation(async () => {
      seq++;
      return {
        id: `cs_test_watch_${seq}`,
        url: `https://checkout.stripe.com/pay/cs_test_watch_${seq}`,
      };
    });
    const listCustMock = vi.fn().mockResolvedValue({ data: [{ id: 'cus_victim_should_not_bind' }] });
    const createCustMock = vi.fn().mockResolvedValue({ id: 'cus_should_not_create' });
    const createPortalMock = vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/p/session/test_123' });

    const stripeMod = await import('../src/lib/stripe');
    vi.spyOn(stripeMod, 'getStripe').mockReturnValue({
      customers: { list: listCustMock, create: createCustMock },
      checkout: { sessions: { create: createSessionMock } },
      billingPortal: { sessions: { create: createPortalMock } },
    } as any);

    // 1. One-time AI Listings Sprint ($249) — does NOT look up or create Stripe Customer before payment
    const resSprint = await worker.fetch(
      new Request('http://localhost:8787/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'watch_offer',
          offer_sku: 'listings_sprint',
          domain: 'https://www.clinica.cl/',
          client_name: 'Dra. Maria Perez',
          client_email: 'owner@clinica.cl',
          client_phone: '+56 9 1234 5678',
          city: 'Santiago',
          service: 'Implantes dentales',
          notes: 'Prioritize ChatGPT + Bing',
          lang: 'es',
        }),
      }),
      mockEnv,
      {} as ExecutionContext
    );
    expect(resSprint.status).toBe(200);
    expect(listCustMock).not.toHaveBeenCalled();
    expect(createCustMock).not.toHaveBeenCalled();
    const sprintCall = createSessionMock.mock.calls[0][0];
    expect(sprintCall.mode).toBe('payment');
    expect(sprintCall.customer).toBeUndefined();
    expect(sprintCall.customer_update).toBeUndefined();
    expect(sprintCall.customer_email).toBe('owner@clinica.cl');
    expect(sprintCall.customer_creation).toBe('always');
    expect(sprintCall.payment_method_types).toBeUndefined();
    expect(sprintCall.line_items[0].price_data.unit_amount).toBe(24900);
    expect(sprintCall.invoice_creation.enabled).toBe(true);
    expect(sprintCall.payment_intent_data.receipt_email).toBe('owner@clinica.cl');
    expect(sprintCall.metadata.offer_sku).toBe('listings_sprint');
    expect(sprintCall.metadata.domain).toBe('clinica.cl');
    expect(sprintCall.metadata.order_id).toMatch(/^ord_/);

    const savedOrder = await getOrderBySessionId(mockEnv, 'cs_test_watch_1');
    expect(savedOrder?.status).toBe('checkout_started');
    expect(savedOrder?.domain).toBe('clinica.cl');

    // 2. Unauthenticated second checkout attempt for same email must NOT overwrite existing PII or bind cus_
    const resWatch = await worker.fetch(
      new Request('http://localhost:8787/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'watch_offer',
          offer_sku: 'watch_local',
          domain: 'attacker.example',
          client_name: 'Attacker Overwrite',
          client_email: 'owner@clinica.cl',
          client_phone: '+1 000 000 0000',
          city: 'Nowhere',
          service: 'Spam Service',
          lang: 'en',
        }),
      }),
      mockEnv,
      {} as ExecutionContext
    );
    expect(resWatch.status).toBe(200);
    expect(listCustMock).not.toHaveBeenCalled();
    expect(createCustMock).not.toHaveBeenCalled();
    const watchCall = createSessionMock.mock.calls[1][0];
    expect(watchCall.mode).toBe('subscription');
    expect(watchCall.customer).toBeUndefined();
    expect(watchCall.customer_email).toBe('owner@clinica.cl');
    expect(watchCall.customer_creation).toBeUndefined();
    expect(watchCall.line_items[0].price_data.unit_amount).toBe(14900);
    expect(watchCall.line_items[0].price_data.recurring).toEqual({ interval: 'month' });
    expect(watchCall.invoice_creation).toBeUndefined();
    expect(watchCall.payment_intent_data).toBeUndefined();
    expect(watchCall.subscription_data.metadata.offer_sku).toBe('watch_local');

    const storedCust = await getCustomerByEmail(mockEnv, 'owner@clinica.cl');
    expect(storedCust?.name).toBe('Dra. Maria Perez');
    expect(storedCust?.phone).toBe('+56 9 1234 5678');
    expect(storedCust?.primary_domain).toBe('clinica.cl');

    // Simulate verified post-payment webhook linking Stripe Customer ID
    await upsertCustomer(mockEnv, { email: 'owner@clinica.cl', stripe_customer_id: 'cus_test_unified_1' });

    // 3. Portfolio Snapshot ($1,500) + Website tiers ($390 / $690 / $1,190)
    const skuCases = [
      { sku: 'portfolio_snapshot', expectedCents: 150000, domain: undefined },
      { sku: 'website_quick_fix', expectedCents: 39000, domain: 'clinic.example.com' },
      { sku: 'website_5page', expectedCents: 69000, domain: 'clinic.example.com' },
      { sku: 'website_10page', expectedCents: 119000, domain: 'clinic.example.com' },
    ];
    for (const sc of skuCases) {
      const resSku = await worker.fetch(
        new Request('http://localhost:8787/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'watch_offer',
            offer_sku: sc.sku,
            client_name: 'Test Buyer',
            client_email: 'buyer@example.com',
            domain: sc.domain,
          }),
        }),
        mockEnv,
        {} as ExecutionContext
      );
      expect(resSku.status).toBe(200);
      const lastCall = createSessionMock.mock.calls[createSessionMock.mock.calls.length - 1][0];
      expect(lastCall.mode).toBe('payment');
      expect(lastCall.line_items[0].price_data.unit_amount).toBe(sc.expectedCents);
      expect(lastCall.metadata.offer_sku).toBe(sc.sku);
    }

    // 4. Admin Orders, Customers & Customer Billing Portal
    const adminOrdersRes = await worker.fetch(
      new Request('http://localhost:8787/admin/orders', {
        method: 'GET',
        headers: { 'X-API-Key': 'test_api_key_123' },
      }),
      mockEnv,
      {} as ExecutionContext
    );
    expect(adminOrdersRes.status).toBe(200);
    expect(adminOrdersRes.headers.get('Access-Control-Allow-Origin')).toBeNull();
    const adminOrdersJson: any = await adminOrdersRes.json();
    expect(adminOrdersJson.success).toBe(true);
    expect(adminOrdersJson.data.orders.length).toBe(6);
    expect(adminOrdersJson.data.metrics.abandoned_count).toBe(6);

    expect(resSprint.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const adminCustRes = await worker.fetch(
      new Request('http://localhost:8787/admin/customers?email=owner@clinica.cl', {
        method: 'GET',
        headers: { 'X-API-Key': 'test_api_key_123' },
      }),
      mockEnv,
      {} as ExecutionContext
    );
    expect(adminCustRes.status).toBe(200);
    const adminCustJson: any = await adminCustRes.json();
    expect(adminCustJson.data.customers[0].orders_count).toBe(2);
    expect(adminCustJson.data.customers[0].stripe_customer_id).toBe('cus_test_unified_1');

    const portalRes = await worker.fetch(
      new Request('http://localhost:8787/customers/cus_test_unified_1/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'test_api_key_123' },
        body: JSON.stringify({ return_url: 'https://sondri.ai/watch/' }),
      }),
      mockEnv,
      {} as ExecutionContext
    );
    expect(portalRes.status).toBe(200);
    const portalJson: any = await portalRes.json();
    expect(portalJson.data.portal_url).toBe('https://billing.stripe.com/p/session/test_123');
    expect(createPortalMock).toHaveBeenCalledWith({
      customer: 'cus_test_unified_1',
      return_url: 'https://sondri.ai/watch/',
    });
  });

  it('rejects untrusted checkout redirect URLs and ignores untrusted Origin headers', async () => {
    const createSessionMock = vi.fn().mockResolvedValue({
      id: 'cs_test_origin_1',
      url: 'https://checkout.stripe.com/pay/cs_test_origin_1',
    });
    const stripeMod = await import('../src/lib/stripe');
    vi.spyOn(stripeMod, 'getStripe').mockReturnValue({
      checkout: { sessions: { create: createSessionMock } },
    } as any);

    // Untrusted Origin falls back to https://sondri.ai
    const untrustedOriginRes = await worker.fetch(
      new Request('https://billing.sondri.ai/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://evil.example',
        },
        body: JSON.stringify({
          type: 'custom',
          custom_amount: 100,
          client_email: 'payer@example.com',
        }),
      }),
      mockEnv,
      {} as ExecutionContext
    );
    expect(untrustedOriginRes.status).toBe(200);
    expect(createSessionMock.mock.calls[0][0].success_url).toBe(
      'https://sondri.ai/success?session_id={CHECKOUT_SESSION_ID}'
    );
    expect(createSessionMock.mock.calls[0][0].cancel_url).toBe('https://sondri.ai/#pricing');

    // Allowed Origin + valid success_url/cancel_url preserves literal {CHECKOUT_SESSION_ID}
    const trustedWatchRes = await worker.fetch(
      new Request('https://billing.sondri.ai/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://watch.sondri.ai',
        },
        body: JSON.stringify({
          type: 'watch_offer',
          offer_sku: 'watch_local',
          client_name: 'Alice',
          client_email: 'alice@clinic.com',
          domain: 'clinic.com',
          success_url: 'https://watch.sondri.ai/success?session_id={CHECKOUT_SESSION_ID}&type=watch_local',
          cancel_url: 'https://watch.sondri.ai/pricing/',
        }),
      }),
      mockEnv,
      {} as ExecutionContext
    );
    expect(trustedWatchRes.status).toBe(200);
    expect(createSessionMock.mock.calls[1][0].success_url).toBe(
      'https://watch.sondri.ai/success?session_id={CHECKOUT_SESSION_ID}&type=watch_local'
    );

    // Malicious success_url / cancel_url inputs rejected with 400 INVALID_REDIRECT_URL
    for (const badUrl of [
      'https://evil.example/steal?session_id={CHECKOUT_SESSION_ID}',
      'javascript:alert(1)',
      'https://sondri.ai@evil.example/phish',
      'http://localhost:4321/pay',
    ]) {
      const badRes = await worker.fetch(
        new Request('https://billing.sondri.ai/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'custom',
            custom_amount: 100,
            client_email: 'payer@example.com',
            success_url: badUrl,
          }),
        }),
        mockEnv,
        {} as ExecutionContext
      );
      expect(badRes.status).toBe(400);
      expect(((await badRes.json()) as any).error.code).toBe('INVALID_REDIRECT_URL');
    }
  });
});
