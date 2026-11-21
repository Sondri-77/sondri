import { beforeEach, describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import {
  createCheckoutOrder,
  getCustomerByEmail,
  getCustomerByStripeId,
  getOrderBySessionId,
  getSubscriptionByStripeId,
  listOrders,
  resetMemoryBillingStore,
  upsertCustomer,
  upsertSubscription,
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
          payment_status: 'paid',
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

  it('rolls back webhook_events idempotency on transient failure so retries succeed instead of dropping', async () => {
    const cust = await upsertCustomer(mockEnv, {
      email: 'retry@clinic.com',
      name: 'Retry Client',
      stripe_customer_id: 'cus_retry_1',
    });

    await createCheckoutOrder(mockEnv, {
      customer_id: cust.id,
      offer_sku: 'aeo_full_audit',
      order_type: 'one_time',
      amount_cents: 9900,
      currency: 'usd',
      status: 'checkout_started',
      domain: 'retryclinic.com',
      stripe_session_id: 'cs_retry_1',
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok', { status: 200 })));

    const evt = {
      id: 'evt_transient_fail',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_retry_1',
          mode: 'payment',
          payment_status: 'paid',
          amount_total: 9900,
          currency: 'usd',
          customer: 'cus_retry_1',
          customer_details: { email: 'retry@clinic.com', name: 'Retry Client' },
          metadata: {
            source: 'aeo_full_audit',
            offer_sku: 'aeo_full_audit',
            domain: 'retryclinic.com',
            customer_id: cust.id,
          },
        },
      },
    };

    const stripeMod = await import('../src/lib/stripe');
    vi.spyOn(stripeMod, 'getStripe')
      .mockReturnValueOnce({
        webhooks: { constructEventAsync: vi.fn().mockResolvedValue(evt) },
      } as any)
      .mockImplementationOnce(() => {
        throw new Error('simulated transient Stripe client failure');
      })
      .mockReturnValue({
        webhooks: { constructEventAsync: vi.fn().mockResolvedValue(evt) },
        checkout: { sessions: { retrieve: vi.fn().mockResolvedValue({ id: 'cs_retry_1', payment_status: 'paid' }) } },
      } as any);

    const sendEvent = () =>
      worker.fetch(
        new Request('http://localhost:8787/webhooks/stripe', {
          method: 'POST',
          headers: { 'stripe-signature': 't=123,v1=valid' },
          body: JSON.stringify(evt),
        }),
        mockEnv,
        {} as ExecutionContext
      );

    // 1st attempt fails inside handler after recordWebhookEventOnce -> returns 500 & rolls back dedup key
    const first = await sendEvent();
    expect(first.status).toBe(500);
    expect((await getOrderBySessionId(mockEnv, 'cs_retry_1'))?.status).toBe('checkout_started');

    // 2nd attempt (retry) processes instead of skipping as duplicate
    const second = await sendEvent();
    expect(second.status).toBe(200);
    const secondJson: any = await second.json();
    expect(secondJson.duplicate).toBeUndefined();
    expect((await getOrderBySessionId(mockEnv, 'cs_retry_1'))?.status).toBe('paid');

    // 3rd attempt (true duplicate) is skipped
    const third = await sendEvent();
    expect(third.status).toBe(200);
    expect(((await third.json()) as any).duplicate).toBe(true);
  });

  it('holds unpaid async checkout sessions until async_payment_succeeded and marks async_payment_failed as failed', async () => {
    const cust = await upsertCustomer(mockEnv, { email: 'ach@clinic.com', name: 'ACH Buyer' });
    await createCheckoutOrder(mockEnv, {
      customer_id: cust.id,
      offer_sku: 'aeo_full_audit',
      order_type: 'one_time',
      amount_cents: 9900,
      currency: 'usd',
      status: 'checkout_started',
      domain: 'achclinic.com',
      stripe_session_id: 'cs_async_ok',
    });
    await createCheckoutOrder(mockEnv, {
      customer_id: cust.id,
      offer_sku: 'aeo_full_audit',
      order_type: 'one_time',
      amount_cents: 9900,
      currency: 'usd',
      status: 'checkout_started',
      domain: 'achclinic.com',
      stripe_session_id: 'cs_async_fail',
    });

    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const queue: any[] = [];
    const stripeMod = await import('../src/lib/stripe');
    vi.spyOn(stripeMod, 'getStripe').mockReturnValue({
      webhooks: { constructEventAsync: vi.fn().mockImplementation(async () => queue.shift()) },
      checkout: {
        sessions: {
          retrieve: vi.fn().mockImplementation(async (sid: string) => ({
            id: sid,
            payment_status: sid === 'cs_async_ok' ? 'unpaid' : 'paid',
          })),
        },
      },
    } as any);

    const postEvt = async (evt: any) => {
      queue.push(evt);
      return worker.fetch(
        new Request('https://billing.sondri.ai/webhooks/stripe', {
          method: 'POST',
          headers: { 'stripe-signature': 't=123,v1=valid' },
          body: JSON.stringify(evt),
        }),
        mockEnv,
        {} as ExecutionContext
      );
    };

    // Unpaid async checkout.session.completed must NOT mark order paid or fire paid Discord/Sheets
    const unpaidCompleted = await postEvt({
      id: 'evt_async_pending_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_async_ok',
          mode: 'payment',
          payment_status: 'unpaid',
          amount_total: 9900,
          currency: 'usd',
          customer_details: { email: 'ach@clinic.com', name: 'ACH Buyer' },
          metadata: { source: 'aeo_full_audit', offer_sku: 'aeo_full_audit', domain: 'achclinic.com' },
        },
      },
    });
    expect(unpaidCompleted.status).toBe(200);
    expect((await getOrderBySessionId(mockEnv, 'cs_async_ok'))?.status).toBe('checkout_started');
    expect(fetchMock).not.toHaveBeenCalled();

    // async_payment_succeeded settles the order and triggers paid notifications
    const settled = await postEvt({
      id: 'evt_async_settled_1',
      type: 'checkout.session.async_payment_succeeded',
      data: {
        object: {
          id: 'cs_async_ok',
          mode: 'payment',
          payment_status: 'paid',
          amount_total: 9900,
          currency: 'usd',
          customer_details: { email: 'ach@clinic.com', name: 'ACH Buyer' },
          metadata: { source: 'aeo_full_audit', offer_sku: 'aeo_full_audit', domain: 'achclinic.com' },
        },
      },
    });
    expect(settled.status).toBe(200);
    expect((await getOrderBySessionId(mockEnv, 'cs_async_ok'))?.status).toBe('paid');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // async_payment_failed marks the pending order failed without marking it paid
    const failed = await postEvt({
      id: 'evt_async_failed_1',
      type: 'checkout.session.async_payment_failed',
      data: {
        object: {
          id: 'cs_async_fail',
          mode: 'payment',
          payment_status: 'unpaid',
          amount_total: 9900,
          currency: 'usd',
          customer_details: { email: 'ach@clinic.com' },
          metadata: { source: 'aeo_full_audit', offer_sku: 'aeo_full_audit', domain: 'achclinic.com' },
        },
      },
    });
    expect(failed.status).toBe(200);
    expect((await getOrderBySessionId(mockEnv, 'cs_async_fail'))?.status).toBe('failed');
  });

  it('reconciles cross-row UNIQUE(stripe_customer_id) collisions in upsertCustomer cleanly', async () => {
    const placeholder = await upsertCustomer(mockEnv, {
      stripe_customer_id: 'cus_conflict_1',
      name: 'Placeholder Name',
    });
    expect(placeholder.email.endsWith('@placeholder.local')).toBe(true);

    const buyer = await upsertCustomer(mockEnv, {
      email: 'buyer@clinic.com',
      name: 'Real Buyer',
    });
    const orderOnPlaceholder = await createCheckoutOrder(mockEnv, {
      customer_id: placeholder.id,
      offer_sku: 'watch_local',
      order_type: 'subscription',
      amount_cents: 14900,
      status: 'paid',
      stripe_invoice_id: 'in_placeholder_1',
    });
    const subOnPlaceholder = await upsertSubscription(mockEnv, {
      customer_id: placeholder.id,
      stripe_subscription_id: 'sub_placeholder_1',
      stripe_customer_id: 'cus_conflict_1',
      status: 'active',
    });

    const reconciled = await upsertCustomer(mockEnv, {
      email: 'buyer@clinic.com',
      stripe_customer_id: 'cus_conflict_1',
    });
    expect(reconciled.id).toBe(buyer.id);
    expect(reconciled.stripe_customer_id).toBe('cus_conflict_1');

    const ordersAfter = await listOrders(mockEnv, { status: 'paid' });
    const repointedOrder = ordersAfter.find((o) => o.id === orderOnPlaceholder.id);
    expect(repointedOrder?.customer_id).toBe(buyer.id);

    const subAfter = await getSubscriptionByStripeId(mockEnv, subOnPlaceholder.stripe_subscription_id);
    expect(subAfter?.customer_id).toBe(buyer.id);

    // Distinct real-email transfer detaches stripe_customer_id from previous owner without UNIQUE conflict
    const secondOwner = await upsertCustomer(mockEnv, {
      email: 'finance@clinic.com',
      stripe_customer_id: 'cus_conflict_1',
    });
    expect(secondOwner.email).toBe('finance@clinic.com');
    expect((await getCustomerByEmail(mockEnv, 'buyer@clinic.com'))?.stripe_customer_id).toBeNull();
    expect((await getCustomerByStripeId(mockEnv, 'cus_conflict_1'))?.id).toBe(secondOwner.id);
  });

  it('prevents out-of-order webhooks from regressing canceled subscriptions, paid renewals, or early refunds', async () => {
    const cust = await upsertCustomer(mockEnv, {
      email: 'order@clinic.com',
      stripe_customer_id: 'cus_ooo_1',
    });
    const earlyOrder = await createCheckoutOrder(mockEnv, {
      customer_id: cust.id,
      offer_sku: 'aeo_full_audit',
      order_type: 'one_time',
      amount_cents: 9900,
      status: 'checkout_started',
      domain: 'oooclinic.com',
      stripe_session_id: 'cs_ooo_1',
    });
    await upsertSubscription(mockEnv, {
      customer_id: cust.id,
      stripe_subscription_id: 'sub_ooo_1',
      stripe_customer_id: 'cus_ooo_1',
      status: 'active',
      current_period_start: '2026-01-01T00:00:00.000Z',
      latest_invoice_id: 'in_newer_paid',
    });
    await createCheckoutOrder(mockEnv, {
      customer_id: cust.id,
      offer_sku: 'watch_local',
      order_type: 'renewal',
      amount_cents: 14900,
      status: 'paid',
      stripe_invoice_id: 'in_newer_paid',
      stripe_subscription_id: 'sub_ooo_1',
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok', { status: 200 })));

    const queue: any[] = [];
    const stripeMod = await import('../src/lib/stripe');
    vi.spyOn(stripeMod, 'getStripe').mockReturnValue({
      webhooks: { constructEventAsync: vi.fn().mockImplementation(async () => queue.shift()) },
      paymentIntents: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'pi_early_refund',
          metadata: { order_id: earlyOrder.id },
        }),
      },
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({
            id: 'cs_ooo_1',
            payment_status: 'paid',
            payment_intent: { id: 'pi_early_refund' },
          }),
        },
      },
    } as any);

    const postEvt = async (evt: any) => {
      queue.push(evt);
      return worker.fetch(
        new Request('https://billing.sondri.ai/webhooks/stripe', {
          method: 'POST',
          headers: { 'stripe-signature': 't=123,v1=valid' },
          body: JSON.stringify(evt),
        }),
        mockEnv,
        {} as ExecutionContext
      );
    };

    // 1. Stale invoice.payment_failed from prior period must NOT mark active sub past_due
    await postEvt({
      id: 'evt_stale_fail',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_older_unpaid',
          created: Math.floor(Date.parse('2025-12-01T00:00:00.000Z') / 1000),
          amount_due: 14900,
          currency: 'usd',
          subscription: 'sub_ooo_1',
        },
      },
    });
    expect((await getSubscriptionByStripeId(mockEnv, 'sub_ooo_1'))?.status).toBe('active');

    // 2. Canceled subscription must remain canceled even if stale subscription.updated arrives later
    await postEvt({
      id: 'evt_sub_del_ooo',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_ooo_1',
          customer: 'cus_ooo_1',
          status: 'canceled',
          canceled_at: 1705000000,
          currency: 'usd',
          items: { data: [] },
        },
      },
    });
    await postEvt({
      id: 'evt_sub_stale_upd',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_ooo_1',
          customer: 'cus_ooo_1',
          status: 'active',
          currency: 'usd',
          items: { data: [] },
        },
      },
    });
    expect((await getSubscriptionByStripeId(mockEnv, 'sub_ooo_1'))?.status).toBe('canceled');

    // 3. Early charge.refunded marks order refunded before checkout.session.completed, and delayed completed preserves 'refunded'
    await postEvt({
      id: 'evt_early_refund',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_ooo_1',
          payment_intent: 'pi_early_refund',
          amount_refunded: 9900,
          currency: 'usd',
        },
      },
    });
    expect((await getOrderBySessionId(mockEnv, 'cs_ooo_1'))?.status).toBe('refunded');

    await postEvt({
      id: 'evt_late_completed',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_ooo_1',
          mode: 'payment',
          payment_status: 'paid',
          amount_total: 9900,
          currency: 'usd',
          customer: 'cus_ooo_1',
          customer_details: { email: 'order@clinic.com' },
          metadata: { source: 'aeo_full_audit', offer_sku: 'aeo_full_audit', domain: 'oooclinic.com' },
        },
      },
    });
    expect((await getOrderBySessionId(mockEnv, 'cs_ooo_1'))?.status).toBe('refunded');
  });
});
