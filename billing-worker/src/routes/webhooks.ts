import { getStripe } from '../lib/stripe';
import { sendDiscordNotification } from '../lib/discord';
import { appendToGoogleSheet } from '../lib/sheets';
import { Env } from '../types';
import Stripe from 'stripe';

export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';
        const currency = (session.currency || 'usd').toUpperCase();
        const customerName = session.customer_details?.name || session.customer_email || 'Website Client';
        const clientEmail = session.customer_details?.email || session.customer_email || 'N/A';
        const description = session.metadata?.description || 'Website Deposit / Custom Payment';

        console.log(`[Checkout Completed] Session ${session.id} paid by ${customerName} ($${amount} ${currency})`);

        // 1. Send Discord Notification
        await sendDiscordNotification(
          env,
          '💰 Website Payment Received!',
          `**Customer:** ${customerName}\n**Email:** ${clientEmail}\n**Amount:** $${amount} ${currency}\n**Reference:** ${description}\n**Session ID:** \`${session.id}\``,
          0x10b981 // Green
        );

        // 2. Append Payment Record to Google Workspace Sheet
        await appendToGoogleSheet(env, {
          date: new Date().toISOString().split('T')[0],
          clientEmail: clientEmail,
          customerName: customerName,
          amount: amount,
          currency: currency,
          invoiceNumber: session.id.substring(0, 14),
          description: description,
          status: 'PAID (Checkout)',
        });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const amount = (invoice.amount_paid / 100).toFixed(2);
        const currency = invoice.currency.toUpperCase();
        const customerName = invoice.customer_name || invoice.customer_email || 'Client';
        const clientEmail = invoice.customer_email || 'N/A';

        console.log(`[Invoice Paid] ${invoice.number} paid by ${customerName} ($${amount} ${currency})`);

        // 1. Send Discord Notification
        await sendDiscordNotification(
          env,
          '💰 Email Invoice Paid!',
          `**Customer:** ${customerName}\n**Amount:** $${amount} ${currency}\n**Invoice Number:** ${invoice.number || invoice.id}\n**Receipt:** [View Receipt](${invoice.hosted_invoice_url})`,
          0x10b981 // Green
        );

        // 2. Append Payment Record to Google Workspace Sheet
        await appendToGoogleSheet(env, {
          date: new Date().toISOString().split('T')[0],
          clientEmail: clientEmail,
          customerName: customerName,
          amount: amount,
          currency: currency,
          invoiceNumber: invoice.number || invoice.id,
          description: invoice.description || 'Sondri Retainer / Invoice',
          status: 'PAID (Invoice)',
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const amount = (invoice.amount_due / 100).toFixed(2);
        const currency = invoice.currency.toUpperCase();
        const customerName = invoice.customer_name || invoice.customer_email || 'Client';

        console.error(`[Invoice Payment Failed] ${invoice.number} failed for ${customerName}`);

        await sendDiscordNotification(
          env,
          '⚠️ Invoice Payment Failed!',
          `**Customer:** ${customerName}\n**Amount Due:** $${amount} ${currency}\n**Invoice:** ${invoice.number || invoice.id}\n**Action Needed:** Follow up with client regarding payment method.`,
          0xef4444 // Red
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.warn(`[Subscription Cancelled] ${subscription.id} cancelled for customer ${subscription.customer}`);

        await sendDiscordNotification(
          env,
          '🔴 Subscription Cancelled',
          `**Subscription ID:** ${subscription.id}\n**Customer ID:** ${subscription.customer}\n**Status:** Cancelled`,
          0xf59e0b // Amber
        );
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
    // CRITICAL: Return 500 for transient processing errors so Stripe retries automatically
    return new Response(`Internal Webhook Handler Error: ${err.message}`, { status: 500 });
  }
}
