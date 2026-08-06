import { getStripe } from '../lib/stripe';
import { Env } from '../types';

export interface CreateCheckoutSessionDTO {
  type: 'fixed' | 'custom';
  plan_id?: 'starter' | 'growth' | 'enterprise';
  custom_amount?: number; // In dollars (e.g. 2500)
  description?: string;
  client_email?: string;
  success_url?: string;
  cancel_url?: string;
}

const PLAN_PRICES: Record<string, { amount: number; name: string; interval: 'month' }> = {
  starter: { amount: 1500, name: 'Sondri Starter Retainer Plan', interval: 'month' },
  growth: { amount: 3500, name: 'Sondri Growth Retainer Plan', interval: 'month' },
  enterprise: { amount: 5000, name: 'Sondri Enterprise Retainer Plan', interval: 'month' },
};

export async function handleCreateCheckoutSession(request: Request, env: Env): Promise<Response> {
  try {
    const body: CreateCheckoutSessionDTO = await request.json();
    const origin = request.headers.get('origin') || 'https://sondri.ai';

    const successUrl = body.success_url || `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancel_url || `${origin}/#pricing`;

    const stripe = getStripe(env);

    let lineItems: any[] = [];
    let mode: 'payment' | 'subscription' = 'payment';

    if (body.type === 'fixed') {
      const planKey = body.plan_id || 'starter';
      const plan = PLAN_PRICES[planKey];

      if (!plan) {
        return Response.json(
          { success: false, error: { code: 'INVALID_PLAN', message: 'Invalid plan_id selected' } },
          { status: 400 }
        );
      }

      mode = 'subscription';
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: 'Monthly AI automation retainer & support.',
            },
            unit_amount: plan.amount * 100, // convert dollars to cents
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ];
    } else if (body.type === 'custom') {
      if (!body.custom_amount || body.custom_amount <= 0) {
        return Response.json(
          { success: false, error: { code: 'INVALID_AMOUNT', message: 'Must provide a valid positive custom_amount' } },
          { status: 400 }
        );
      }

      mode = 'payment';
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: body.description || 'Custom Sondri AI Services Deposit / Payment',
              description: 'Custom agreed payment for Sondri services.',
            },
            unit_amount: Math.round(body.custom_amount * 100), // convert to cents
          },
          quantity: 1,
        },
      ];
    } else {
      return Response.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Type must be "fixed" or "custom"' } },
        { status: 400 }
      );
    }

    const sessionParams: any = {
      managed_payments: { enabled: false },
      line_items: lineItems,
      mode: mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        description: body.description || 'Custom Sondri AI Payment / Deposit',
      },
    };

    if (body.client_email) {
      sessionParams.customer_email = body.client_email;
      sessionParams.payment_intent_data = {
        receipt_email: body.client_email,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({
      success: true,
      data: {
        checkout_url: session.url,
        session_id: session.id,
      },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: err.code || 'STRIPE_ERROR', message: err.message } },
      { status: err.statusCode || 500 }
    );
  }
}
