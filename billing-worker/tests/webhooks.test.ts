import { beforeEach, describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import {
  createCheckoutOrder,
  getOrderBySessionId,
  getSubscriptionByStripeId,
  listOrders,
  resetMemoryBillingStore,
  upsertCustomer,
} from '../src/lib/db';
import { Env } from '../src/types';

const mockEnv: Env = {
  STRIPE_SECRET_KEY: 'sk_test_mock_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_mock_123',
  API_KEY: 'test_api_key_123',
  DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/mock',
  GOOGLE_SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/mock/exec',
};

describe('Billing Worker Webhook & Lifecycle Router', () => {
  beforeEach(() => {
    resetMemoryBillingStore();
    vi.restoreAllMocks();
  });

  it('should reject webhook requests missing the stripe-signature header', async () => {
    const req = new Request('http://localhost:8787/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);

    expect(res.status).toBe(400);
    expect(await res.text()).toContain('Missing stripe-signature header');
  });

  it('should reject webhooks if STRIPE_WEBHOOK_SECRET is missing', async () => {
    const req = new Request('http://localhost:8787/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 't=123,v1=fake' },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const envWithoutSecret = { ...mockEnv, STRIPE_WEBHOOK_SECRET: '' };
    const res = await worker.fetch(req, envWithoutSecret, {} as ExecutionContext);

    expect(res.status).toBe(500);
    expect(await res.text()).toContain('Webhook secret missing');
  });

  it('should process checkout completed, deduplicate retries, handle expiration, sync subscription lifecycle, log renewals, failures, and refunds', async () => {
    const cust = await upsertCustomer(mockEnv, {
      email: 'dr@apexdental.com',
      name: 'Dr. Apex',
      phone: '+1 555 0100',
      primary_domain: 'apexdental.com',
      city: 'Austin, TX',
      service: 'Dental Implants',
      stripe_customer_id: 'cus_apex_1',
    });

    await createCheckoutOrder(mockEnv, {
      customer_id: cust.id,
      offer_sku: 'watch_local',
      order_type: 'subscription',
      amount_cents: 14900,
      currency: 'usd',
      status: 'checkout_started',
      domain: 'apexdental.com',
      city: 'Austin, TX',
      service: 'Dental Implants',
      notes: 'Focus on All-on-4 implants',
      stripe_session_id: 'cs_apex_1',
    });

    await createCheckoutOrder(mockEnv, {
      customer_id: cust.id,
      offer_sku: 'listings_sprint',
      order_type: 'one_time',
      amount_cents: 24900,
      currency: 'usd',
      status: 'checkout_started',
      domain: 'apexdental.com',
      stripe_session_id: 'cs_expired_1',
    });

    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    let eventQueue: any[] = [];
    const stripeMod = await import('../src/lib/stripe');
    vi.spyOn(stripeMod, 'getStripe').mockReturnValue({
      webhooks: {
        constructEventAsync: vi.fn().mockImplementation(async () => eventQueue.shift()),
      },
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({
            id: 'cs_apex_1',
            invoice: { id: 'in_init_1', hosted_invoice_url: 'https://stripe.com/in_init_1' },
            payment_intent: { id: 'pi_init_1', latest_charge: { receipt_url: 'https://stripe.com/rcpt_init_1' } },
            subscription: {
              id: 'sub_apex_1',
              customer: 'cus_apex_1',
              status: 'active',
              currency: 'usd',
              current_period_start: 1700000000,
              current_period_end: 1702592000,
              cancel_at_period_end: false,
              canceled_at: null,
              latest_invoice: 'in_init_1',
              metadata: { offer_sku: 'watch_local', domain: 'apexdental.com', customer_id: cust.id },
              items: { data: [{ price: { unit_amount: 14900, currency: 'usd', recurring: { interval: 'month' } } }] },
            },
          }),
        },
      },
    } as any);

    const postWebhook = async (evt: any) => {
      eventQueue.push(evt);
      return worker.fetch(
        new Request('http://localhost:8787/webhooks/stripe', {
          method: 'POST',
          headers: { 'stripe-signature': 't=123,v1=valid' },
          body: JSON.stringify(evt),
        }),
        mockEnv,
        {} as ExecutionContext
      );
    };

    // 1. checkout.session.completed (Watch Local subscription)
    const evtCompleted = {
      id: 'evt_completed_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_apex_1',
          mode: 'subscription',
          amount_total: 14900,
          currency: 'usd',
          customer: 'cus_apex_1',
          customer_details: { email: 'dr@apexdental.com', name: 'Dr. Apex' },
          subscription: 'sub_apex_1',
          metadata: {
            source: 'watch_offer',
            offer_sku: 'watch_local',
            domain: 'apexdental.com',
            city: 'Austin, TX',
            service: 'Dental Implants',
            customer_id: cust.id,
          },
        },
      },
    };
    const r1 = await postWebhook(evtCompleted);
    expect(r1.status).toBe(200);
    const paidOrder = await getOrderBySessionId(mockEnv, 'cs_apex_1');
    expect(paidOrder?.status).toBe('paid');
    expect(paidOrder?.stripe_subscription_id).toBe('sub_apex_1');
    expect(paidOrder?.receipt_url).toBe('https://stripe.com/rcpt_init_1');

    const activeSub = await getSubscriptionByStripeId(mockEnv, 'sub_apex_1');
    expect(activeSub?.status).toBe('active');
    expect(activeSub?.amount_cents).toBe(14900);
    expect(fetchMock).toHaveBeenCalledTimes(2); // Discord + Google Sheets

    // 2. Duplicate delivery of evt_completed_1 is safely ignored
    const rDup = await postWebhook(evtCompleted);
    expect(rDup.status).toBe(200);
    expect(((await rDup.json()) as any).duplicate).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2); // Zero duplicate calls!

    // 3. checkout.session.expired marks order expired and sends soft Discord lead alert
    const rExp = await postWebhook({
      id: 'evt_expired_1',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_expired_1',
          amount_total: 24900,
          currency: 'usd',
          customer_details: { email: 'dr@apexdental.com' },
          metadata: { offer_sku: 'listings_sprint', domain: 'apexdental.com' },
        },
      },
    });
    expect(rExp.status).toBe(200);
    expect((await getOrderBySessionId(mockEnv, 'cs_expired_1'))?.status).toBe('expired');
    expect(fetchMock).toHaveBeenCalledTimes(3); // +1 Discord soft lead alert

    // 4. invoice.paid for subscription_create is skipped; subscription_cycle logs renewal order
    const rInitInv = await postWebhook({
      id: 'evt_inv_init',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_init_1',
          billing_reason: 'subscription_create',
          amount_paid: 14900,
          currency: 'usd',
          customer: 'cus_apex_1',
          subscription: 'sub_apex_1',
          metadata: {},
        },
      },
    });
    expect(rInitInv.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3); // Skipped!

    const rRenewal = await postWebhook({
      id: 'evt_inv_renewal',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_cycle_2',
          number: 'SONDRI-0002',
          billing_reason: 'subscription_cycle',
          amount_paid: 14900,
          currency: 'usd',
          customer: 'cus_apex_1',
          customer_email: 'dr@apexdental.com',
          customer_name: 'Dr. Apex',
          subscription: 'sub_apex_1',
          payment_intent: 'pi_cycle_2',
          hosted_invoice_url: 'https://stripe.com/in_cycle_2',
          invoice_pdf: 'https://stripe.com/in_cycle_2.pdf',
          metadata: {},
        },
      },
    });
    expect(rRenewal.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(5); // +1 Discord + 1 Sheets
    const ordersAfterRenewal = await listOrders(mockEnv, { status: 'paid' });
    expect(ordersAfterRenewal.some((o) => o.order_type === 'renewal' && o.stripe_invoice_id === 'in_cycle_2')).toBe(true);

    // 5. invoice.payment_failed marks subscription past_due
    const rFail = await postWebhook({
      id: 'evt_inv_fail',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_fail_3',
          amount_due: 14900,
          currency: 'usd',
          customer_email: 'dr@apexdental.com',
          customer_name: 'Dr. Apex',
          subscription: 'sub_apex_1',
        },
      },
    });
    expect(rFail.status).toBe(200);
    expect((await getSubscriptionByStripeId(mockEnv, 'sub_apex_1'))?.status).toBe('past_due');

    // 6. customer.subscription.deleted marks subscription canceled
    const rCancel = await postWebhook({
      id: 'evt_sub_del',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_apex_1',
          customer: 'cus_apex_1',
          status: 'canceled',
          canceled_at: 1703000000,
          currency: 'usd',
          metadata: {},
          items: { data: [] },
        },
      },
    });
    expect(rCancel.status).toBe(200);
    expect((await getSubscriptionByStripeId(mockEnv, 'sub_apex_1'))?.status).toBe('canceled');

    // 7. charge.refunded marks matching payment_intent order as refunded
    const rRefund = await postWebhook({
      id: 'evt_refund_1',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_1',
          payment_intent: 'pi_init_1',
          amount: 14900,
          amount_refunded: 14900,
          currency: 'usd',
        },
      },
    });
    expect(rRefund.status).toBe(200);
    expect((await getOrderBySessionId(mockEnv, 'cs_apex_1'))?.status).toBe('refunded');
  });
});
