import { getStripe } from '../lib/stripe';
import { sendDiscordNotification } from '../lib/discord';
import { appendToGoogleSheet } from '../lib/sheets';
import {
  deleteWebhookEvent,
  getCustomerById,
  getCustomerByStripeId,
  getOrderBySessionId,
  getSubscriptionByStripeId,
  markLeadPaid99,
  markOrderExpired,
  markOrderPaid,
  markOrderRefundedByPaymentIntent,
  markSubscriptionStatus,
  recordRenewalOrder,
  recordWebhookEventOnce,
  upsertCustomer,
  upsertSubscription,
} from '../lib/db';
import { runBackgroundFullAuditBaseline } from './audit';
import { Env } from '../types';
import Stripe from 'stripe';

function isoFromUnix(sec?: number | null): string | null {
  return typeof sec === 'number' && sec > 0 ? new Date(sec * 1000).toISOString() : null;
}

function getId(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && typeof val.id === 'string') return val.id;
  return null;
}

async function resolveCustomerIdForStripeCustomer(
  env: Env,
  stripeCustId: string | null,
  fallbackEmail?: string | null,
  fallbackName?: string | null
): Promise<string> {
  if (stripeCustId) {
    const byStripe = await getCustomerByStripeId(env, stripeCustId);
    if (byStripe) return byStripe.id;
  }
  if (fallbackEmail || stripeCustId) {
    const cust = await upsertCustomer(env, {
      email: fallbackEmail || undefined,
      name: fallbackName || undefined,
      stripe_customer_id: stripeCustId || undefined,
    });
    return cust.id;
  }
  return '';
}

async function syncStripeSubscriptionToD1(
  env: Env,
  sub: Stripe.Subscription,
  fallbackMeta?: { customer_id?: string; offer_sku?: string; domain?: string; email?: string | null; name?: string | null }
): Promise<void> {
  const stripeCustomerId = getId(sub.customer) || '';
  const customerId =
    fallbackMeta?.customer_id ||
    sub.metadata?.customer_id ||
    (await resolveCustomerIdForStripeCustomer(env, stripeCustomerId, fallbackMeta?.email, fallbackMeta?.name));

  const firstItem = sub.items?.data?.[0];
  const amountCents = firstItem?.price?.unit_amount ?? null;
  const interval = firstItem?.price?.recurring?.interval || 'month';
  const currency = sub.currency || firstItem?.price?.currency || 'usd';

  await upsertSubscription(env, {
    customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_customer_id: stripeCustomerId,
    offer_sku: sub.metadata?.offer_sku || fallbackMeta?.offer_sku || null,
    domain: sub.metadata?.domain || fallbackMeta?.domain || null,
    status: sub.status,
    amount_cents: amountCents,
    currency,
    interval,
    current_period_start: isoFromUnix(sub.current_period_start),
    current_period_end: isoFromUnix(sub.current_period_end),
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    canceled_at: isoFromUnix(sub.canceled_at),
    latest_invoice_id: getId(sub.latest_invoice),
  });
}

export async function handleStripeWebhook(
  request: Request,
  env: Env,
  ctx?: ExecutionContext
): Promise<Response> {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook Error] Missing stripe-signature header');
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.error('[Webhook Error] STRIPE_WEBHOOK_SECRET secret is not configured in Worker environment.');
    return new Response('Webhook secret missing', { status: 500 });
  }

  let event: Stripe.Event;
  const bodyText = await request.text();

  try {
    const stripe = getStripe(env);
    // constructEventAsync is required for Workers environment
    event = await stripe.webhooks.constructEventAsync(
      bodyText,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`[Webhook Signature Verification Failed] ${err.message}`);
    // CRITICAL: Return 400 on signature verification failure
    return new Response(`Webhook Signature Error: ${err.message}`, { status: 400 });
  }

  console.log(`[Stripe Webhook Received] Type: ${event.type} | ID: ${event.id}`);

  // Idempotency guard against duplicate Stripe webhook deliveries
  const isFirstDelivery = await recordWebhookEventOnce(env, event.id, event.type);
  if (!isFirstDelivery) {
    console.log(`[Webhook Skipped Duplicate] ${event.id} (${event.type})`);
    return Response.json({ received: true, duplicate: true }, { status: 200 });
  }

  try {
    const stripe = getStripe(env);

    switch (event.type) {
      case 'checkout.session.completed': {
        const sessionPayload = event.data.object as Stripe.Checkout.Session;

        let invoiceUrl = '';
        let receiptUrl = '';
        let expandedInvoiceId: string | null = getId(sessionPayload.invoice);
        let expandedPaymentIntentId: string | null = getId(sessionPayload.payment_intent);
        let expandedSubObj: Stripe.Subscription | null = null;
        let expandedSubId: string | null = getId(sessionPayload.subscription);

        try {
          const expandedSession = await stripe.checkout.sessions.retrieve(sessionPayload.id, {
            expand: ['invoice', 'payment_intent.latest_charge', 'subscription'],
          });
          const invoiceObj = typeof expandedSession.invoice === 'object' && expandedSession.invoice ? (expandedSession.invoice as Stripe.Invoice) : null;
          const paymentIntentObj = typeof expandedSession.payment_intent === 'object' && expandedSession.payment_intent ? (expandedSession.payment_intent as Stripe.PaymentIntent) : null;
          const latestChargeObj = paymentIntentObj && typeof paymentIntentObj.latest_charge === 'object' ? (paymentIntentObj.latest_charge as Stripe.Charge) : null;
          if (typeof expandedSession.subscription === 'object' && expandedSession.subscription) {
            expandedSubObj = expandedSession.subscription as Stripe.Subscription;
            expandedSubId = expandedSubObj.id;
          }
          if (invoiceObj?.id) expandedInvoiceId = invoiceObj.id;
          if (paymentIntentObj?.id) expandedPaymentIntentId = paymentIntentObj.id;
          if (invoiceObj?.hosted_invoice_url) invoiceUrl = invoiceObj.hosted_invoice_url;
          if (latestChargeObj?.receipt_url) receiptUrl = latestChargeObj.receipt_url;
        } catch (e: any) {
          console.warn(`[Webhook Session Expand Warning] ${e.message}`);
        }

        const existingOrder = await getOrderBySessionId(env, sessionPayload.id);
        const amountCents = sessionPayload.amount_total ?? existingOrder?.amount_cents ?? 0;
        const amount = (amountCents / 100).toFixed(2);
        const currency = (sessionPayload.currency || existingOrder?.currency || 'usd').toUpperCase();
        const customerName =
          sessionPayload.customer_details?.name ||
          sessionPayload.metadata?.client_name ||
          sessionPayload.customer_email ||
          'Website Client';
        const clientEmail =
          sessionPayload.customer_details?.email ||
          sessionPayload.customer_email ||
          '';
        const phone = sessionPayload.customer_details?.phone || sessionPayload.metadata?.client_phone || '';
        const stripeCustomerId = getId(sessionPayload.customer);

        const description = sessionPayload.metadata?.description || 'Website Deposit / Custom Payment';
        const isAeoFullAudit = sessionPayload.metadata?.source === 'aeo_full_audit';
        const isWatchOffer = sessionPayload.metadata?.source === 'watch_offer' || isAeoFullAudit;
        const offerSku = sessionPayload.metadata?.offer_sku || existingOrder?.offer_sku || '';
        const shouldRunBaseline = isAeoFullAudit || sessionPayload.metadata?.run_baseline === 'true';
        const auditId = sessionPayload.metadata?.audit_id || existingOrder?.audit_id || undefined;
        const auditedDomain = sessionPayload.metadata?.domain || existingOrder?.domain || '';
        const city = sessionPayload.metadata?.city || existingOrder?.city || '';
        const service = sessionPayload.metadata?.service || existingOrder?.service || '';
        const notes = sessionPayload.metadata?.notes || existingOrder?.notes || '';
        const lang = sessionPayload.metadata?.lang === 'es' ? 'es' : 'en';

        // Sync Customer & Order in D1
        let customerId = existingOrder?.customer_id || sessionPayload.metadata?.customer_id || '';
        if (clientEmail || stripeCustomerId || customerId) {
          const syncedCustomer = await upsertCustomer(env, {
            email: clientEmail || undefined,
            name: customerName,
            phone: phone || undefined,
            primary_domain: auditedDomain || undefined,
            city: city || undefined,
            service: service || undefined,
            lang,
            stripe_customer_id: stripeCustomerId || undefined,
          });
          customerId = syncedCustomer.id;
        }

        await markOrderPaid(env, sessionPayload.id, {
          stripe_payment_intent_id: expandedPaymentIntentId,
          stripe_invoice_id: expandedInvoiceId,
          stripe_subscription_id: expandedSubId,
          receipt_url: receiptUrl || null,
          invoice_url: invoiceUrl || null,
          fallback: customerId
            ? {
                customer_id: customerId,
                offer_sku: offerSku || (sessionPayload.mode === 'subscription' ? 'subscription' : 'checkout'),
                order_type: sessionPayload.mode === 'subscription' ? 'subscription' : 'one_time',
                amount_cents: amountCents,
                currency: currency.toLowerCase(),
                domain: auditedDomain || null,
                city: city || null,
                service: service || null,
                notes: notes || null,
                audit_id: auditId || null,
                lang,
              }
            : undefined,
        });

        // Sync initial Subscription row if applicable
        if (sessionPayload.mode === 'subscription' && expandedSubId) {
          if (expandedSubObj) {
            await syncStripeSubscriptionToD1(env, expandedSubObj, {
              customer_id: customerId,
              offer_sku: offerSku,
              domain: auditedDomain,
              email: clientEmail,
              name: customerName,
            });
          } else {
            await upsertSubscription(env, {
              customer_id: customerId,
              stripe_subscription_id: expandedSubId,
              stripe_customer_id: stripeCustomerId || '',
              offer_sku: offerSku || null,
              domain: auditedDomain || null,
              status: 'active',
              amount_cents: amountCents || null,
              currency: currency.toLowerCase(),
              interval: 'month',
              latest_invoice_id: expandedInvoiceId,
            });
          }
        }

        let discordMsg = `**Customer:** ${customerName}\n**Email:** ${clientEmail || 'N/A'}\n**Amount:** $${amount} ${currency}\n**Reference:** ${description}`;
        if (phone) discordMsg += `\n**Phone / WhatsApp:** ${phone}`;
        if (offerSku) discordMsg += `\n**Offer SKU:** \`${offerSku}\``;
        if (auditedDomain) discordMsg += `\n**Domain:** \`${auditedDomain}\``;
        if (city || service) discordMsg += `\n**Market / Service:** ${[city, service].filter(Boolean).join(' · ')}`;
        if (notes) discordMsg += `\n**Notes:** ${notes}`;
        if (auditId) discordMsg += `\n**Mini Audit ID:** \`${auditId}\``;
        discordMsg += `\n**Session ID:** \`${sessionPayload.id}\``;
        if (receiptUrl) discordMsg += `\n**Receipt:** [View Receipt](${receiptUrl})`;
        if (invoiceUrl) discordMsg += `\n**Invoice:** [View Invoice](${invoiceUrl})`;

        console.log(`[Checkout Completed] Session ${sessionPayload.id} paid by ${customerName} ($${amount} ${currency})`);

        // Mark D1 lead as paid & optionally queue background baseline
        if (isWatchOffer) {
          await markLeadPaid99(env, auditId, clientEmail || undefined, sessionPayload.id);
          if (shouldRunBaseline && auditId && ctx) {
            ctx.waitUntil(runBackgroundFullAuditBaseline(env, auditId, clientEmail || 'N/A'));
          }
        }

        // 1. Send Discord Notification
        await sendDiscordNotification(
          env,
          isAeoFullAudit
            ? '🎯 $99 AEO Full Audit Purchased!'
            : isWatchOffer
              ? `🚀 Sondri Watch Order (${offerSku})!`
              : '💰 Website Payment Received!',
          discordMsg,
          0x10b981 // Green
        );

        // 2. Append Payment Record to Google Workspace Sheet
        await appendToGoogleSheet(env, {
          date: new Date().toISOString().split('T')[0],
          clientEmail: clientEmail || 'N/A',
          customerName: customerName,
          amount: amount,
          currency: currency,
          invoiceNumber: expandedInvoiceId || sessionPayload.id.substring(0, 14),
          description: description,
          status: isAeoFullAudit
            ? 'PAID (AEO Full Audit $99)'
            : isWatchOffer
              ? `PAID (Watch: ${offerSku})`
              : 'PAID (Checkout)',
          receiptUrl: receiptUrl || undefined,
          invoiceUrl: invoiceUrl || undefined,
          phone: phone || undefined,
          domain: auditedDomain || undefined,
          city: city || undefined,
          service: service || undefined,
          offerSku: offerSku || undefined,
          orderType: sessionPayload.mode === 'subscription' ? 'subscription' : 'one_time',
          subscriptionId: expandedSubId || undefined,
        });
        break;
      }

      case 'checkout.session.expired': {
        const sessionPayload = event.data.object as Stripe.Checkout.Session;
        const expiredOrder = await markOrderExpired(env, sessionPayload.id);

        const amountCents = sessionPayload.amount_total ?? expiredOrder?.amount_cents ?? 0;
        const amount = (amountCents / 100).toFixed(2);
        const currency = (sessionPayload.currency || expiredOrder?.currency || 'usd').toUpperCase();
        const offerSku = sessionPayload.metadata?.offer_sku || expiredOrder?.offer_sku || 'Checkout';
        const domain = sessionPayload.metadata?.domain || expiredOrder?.domain || '';
        const city = sessionPayload.metadata?.city || expiredOrder?.city || '';
        const service = sessionPayload.metadata?.service || expiredOrder?.service || '';
        const notes = sessionPayload.metadata?.notes || expiredOrder?.notes || '';
        const linkedCustomer = expiredOrder?.customer_id ? await getCustomerById(env, expiredOrder.customer_id) : null;
        const name = sessionPayload.metadata?.client_name || linkedCustomer?.name || 'Prospect';
        const email = sessionPayload.customer_details?.email || sessionPayload.customer_email || linkedCustomer?.email || 'N/A';
        const phone = sessionPayload.metadata?.client_phone || '';

        let msg = `**Prospect:** ${name}\n**Email:** ${email}\n**Selected Plan:** \`${offerSku}\` ($${amount} ${currency})`;
        if (phone) msg += `\n**Phone / WhatsApp:** ${phone}`;
        if (domain) msg += `\n**Domain:** \`${domain}\``;
        if (city || service) msg += `\n**Market / Service:** ${[city, service].filter(Boolean).join(' · ')}`;
        if (notes) msg += `\n**Notes:** ${notes}`;
        msg += `\n**Session ID:** \`${sessionPayload.id}\``;

        console.log(`[Checkout Expired] Session ${sessionPayload.id} expired for ${email} (${offerSku})`);
        await sendDiscordNotification(
          env,
          `🕒 Abandoned Checkout (${offerSku})`,
          msg,
          0xf59e0b // Soft Amber Lead Alert
        );
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncStripeSubscriptionToD1(env, subscription);
        console.log(`[Subscription Synced] ${subscription.id} -> ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = getId(subscription.customer) || '';
        const existingSub = await getSubscriptionByStripeId(env, subscription.id);
        await syncStripeSubscriptionToD1(env, {
          ...subscription,
          status: 'canceled',
          canceled_at: subscription.canceled_at || Math.floor(Date.now() / 1000),
        });

        const cust =
          (existingSub?.customer_id ? await getCustomerById(env, existingSub.customer_id) : null) ||
          (stripeCustomerId ? await getCustomerByStripeId(env, stripeCustomerId) : null);
        const sku = subscription.metadata?.offer_sku || existingSub?.offer_sku || 'Subscription';
        const domain = subscription.metadata?.domain || existingSub?.domain || cust?.primary_domain || '';

        console.warn(`[Subscription Cancelled] ${subscription.id} cancelled for customer ${stripeCustomerId}`);
        let msg = `**Subscription ID:** \`${subscription.id}\`\n**Plan:** \`${sku}\`\n**Status:** Cancelled`;
        if (cust?.name || cust?.email) {
          msg = `**Customer:** ${cust.name || cust.email}\n**Email:** ${cust.email}\n` + msg;
        }
        if (domain) msg += `\n**Domain:** \`${domain}\``;

        await sendDiscordNotification(
          env,
          '🔴 Subscription Cancelled',
          msg,
          0xf59e0b
        );
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;

        // Skip one-time or initial subscription checkout invoices already recorded by checkout.session.completed
        const isInitialCheckoutInvoice =
          invoice.metadata?.is_checkout_invoice === 'true' ||
          invoice.metadata?.source === 'website_checkout' ||
          invoice.billing_reason === 'subscription_create' ||
          (Boolean((invoice as any).checkout_session) && invoice.billing_reason !== 'subscription_cycle');

        if (isInitialCheckoutInvoice) {
          console.log(`[Webhook Skipped] invoice.paid for initial Checkout Session Invoice ${invoice.id}`);
          break;
        }

        const amountCents = invoice.amount_paid || 0;
        const amount = (amountCents / 100).toFixed(2);
        const currency = (invoice.currency || 'usd').toUpperCase();
        const stripeCustomerId = getId(invoice.customer);
        const subId = getId((invoice as any).subscription);
        const piId = getId((invoice as any).payment_intent);
        const existingSub = subId ? await getSubscriptionByStripeId(env, subId) : null;
        const custById = existingSub?.customer_id ? await getCustomerById(env, existingSub.customer_id) : null;
        const custByStripe = stripeCustomerId ? await getCustomerByStripeId(env, stripeCustomerId) : null;
        const customerName = invoice.customer_name || custById?.name || custByStripe?.name || invoice.customer_email || 'Client';
        const clientEmail = invoice.customer_email || custById?.email || custByStripe?.email || 'N/A';

        const isRenewal = invoice.billing_reason === 'subscription_cycle';
        const offerSku = existingSub?.offer_sku || (invoice.lines?.data?.[0]?.metadata?.offer_sku) || 'retainer_renewal';
        const domain = existingSub?.domain || custById?.primary_domain || custByStripe?.primary_domain || '';

        const customerId = await resolveCustomerIdForStripeCustomer(
          env,
          stripeCustomerId,
          clientEmail !== 'N/A' ? clientEmail : null,
          customerName
        );

        if (customerId) {
          await recordRenewalOrder(env, {
            customer_id: customerId,
            offer_sku: offerSku,
            amount_cents: amountCents,
            currency: currency.toLowerCase(),
            domain: domain || null,
            stripe_payment_intent_id: piId,
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: subId,
            receipt_url: invoice.hosted_invoice_url || null,
            invoice_url: invoice.invoice_pdf || invoice.hosted_invoice_url || null,
          });
        }

        if (subId) {
          await markSubscriptionStatus(env, subId, 'active', { latest_invoice_id: invoice.id });
        }

        console.log(`[Invoice Paid] ${invoice.number || invoice.id} paid by ${customerName} ($${amount} ${currency})`);

        await sendDiscordNotification(
          env,
          isRenewal ? `🔄 Subscription Renewed (${offerSku})!` : '💰 Email Invoice Paid!',
          `**Customer:** ${customerName}\n**Email:** ${clientEmail}${domain ? `\n**Domain:** \`${domain}\`` : ''}\n**Amount:** $${amount} ${currency}\n**Invoice:** ${invoice.number || invoice.id}\n**Receipt:** [View Receipt](${invoice.hosted_invoice_url})`,
          0x10b981
        );

        await appendToGoogleSheet(env, {
          date: new Date().toISOString().split('T')[0],
          clientEmail: clientEmail,
          customerName: customerName,
          amount: amount,
          currency: currency,
          invoiceNumber: invoice.number || invoice.id,
          description: invoice.description || (isRenewal ? `Subscription Renewal (${offerSku})` : 'Sondri Retainer / Invoice'),
          status: isRenewal ? `PAID (Renewal: ${offerSku})` : 'PAID (Invoice)',
          receiptUrl: invoice.hosted_invoice_url || undefined,
          invoiceUrl: invoice.invoice_pdf || invoice.hosted_invoice_url || undefined,
          domain: domain || undefined,
          offerSku,
          orderType: isRenewal ? 'renewal' : 'one_time',
          subscriptionId: subId || undefined,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const amount = (invoice.amount_due / 100).toFixed(2);
        const currency = (invoice.currency || 'usd').toUpperCase();
        const subId = getId((invoice as any).subscription);
        const existingSub = subId ? await getSubscriptionByStripeId(env, subId) : null;
        const customerName = invoice.customer_name || invoice.customer_email || 'Client';
        const clientEmail = invoice.customer_email || 'N/A';

        if (subId) {
          await markSubscriptionStatus(env, subId, 'past_due', { latest_invoice_id: invoice.id });
        }

        console.error(`[Invoice Payment Failed] ${invoice.number || invoice.id} failed for ${customerName}`);

        await sendDiscordNotification(
          env,
          '⚠️ Invoice Payment Failed!',
          `**Customer:** ${customerName}\n**Email:** ${clientEmail}${existingSub?.domain ? `\n**Domain:** \`${existingSub.domain}\`` : ''}\n**Amount Due:** $${amount} ${currency}\n**Invoice:** ${invoice.number || invoice.id}${invoice.hosted_invoice_url ? `\n**Hosted Invoice:** [Pay Invoice](${invoice.hosted_invoice_url})` : ''}`,
          0xef4444 // Red
        );
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = getId(charge.payment_intent) || '';
        const refundedOrder = await markOrderRefundedByPaymentIntent(env, paymentIntentId);
        const amount = ((charge.amount_refunded || charge.amount || 0) / 100).toFixed(2);
        const currency = (charge.currency || 'usd').toUpperCase();
        const cust = refundedOrder?.customer_id ? await getCustomerById(env, refundedOrder.customer_id) : null;

        let msg = `**Refunded:** $${amount} ${currency}\n**Payment Intent:** \`${paymentIntentId || 'N/A'}\``;
        if (cust) msg = `**Customer:** ${cust.name || cust.email}\n**Email:** ${cust.email}\n` + msg;
        if (refundedOrder?.offer_sku) msg += `\n**SKU:** \`${refundedOrder.offer_sku}\``;
        if (refundedOrder?.domain) msg += `\n**Domain:** \`${refundedOrder.domain}\``;

        console.warn(`[Charge Refunded] ${charge.id} ($${amount} ${currency})`);
        await sendDiscordNotification(env, '↩️ Payment Refunded', msg, 0xf59e0b);
        break;
      }

      default:
        console.log(`[Unhandled Webhook Event] ${event.type}`);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error(`[Webhook Processing Error] ${err.message}`, err);
    try {
      await deleteWebhookEvent(env, event.id);
    } catch (rollbackErr: any) {
      console.error(`[Webhook Idempotency Rollback Error] ${rollbackErr?.message || rollbackErr}`);
    }
    // CRITICAL: Return 500 for transient processing errors so Stripe retries automatically
    return new Response(`Internal Webhook Handler Error: ${err.message}`, { status: 500 });
  }
}
