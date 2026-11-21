import { getStripe } from '../lib/stripe';
import {
  getAdminMetrics,
  getCustomerById,
  listCustomersWithStats,
  listOrders,
  listSubscriptions,
} from '../lib/db';
import { Env } from '../types';

export async function handleAdminOrders(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const offer_sku = url.searchParams.get('offer_sku') || undefined;
    const q = url.searchParams.get('q') || undefined;
    const limitParam = parseInt(url.searchParams.get('limit') || '100', 10);
    const limit = Number.isFinite(limitParam) ? limitParam : 100;

    const [metrics, orders] = await Promise.all([
      getAdminMetrics(env),
      listOrders(env, { status, offer_sku, q, limit }),
    ]);

    return Response.json({
      success: true,
      data: { metrics, orders },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: 'ADMIN_ERROR', message: err?.message || 'Failed to list orders' } },
      { status: 500 }
    );
  }
}

export async function handleAdminSubscriptions(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const q = url.searchParams.get('q') || undefined;
    const limitParam = parseInt(url.searchParams.get('limit') || '100', 10);
    const limit = Number.isFinite(limitParam) ? limitParam : 100;

    const subscriptions = await listSubscriptions(env, { status, q, limit });

    return Response.json({
      success: true,
      data: { subscriptions },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: 'ADMIN_ERROR', message: err?.message || 'Failed to list subscriptions' } },
      { status: 500 }
    );
  }
}

export async function handleAdminCustomers(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email') || undefined;
    const q = url.searchParams.get('q') || undefined;
    const limitParam = parseInt(url.searchParams.get('limit') || '100', 10);
    const limit = Number.isFinite(limitParam) ? limitParam : 100;

    const customers = await listCustomersWithStats(env, { email, q, limit });

    return Response.json({
      success: true,
      data: { customers },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: 'ADMIN_ERROR', message: err?.message || 'Failed to list customers' } },
      { status: 500 }
    );
  }
}

export async function handleCreatePortalSession(
  customerIdOrStripeId: string,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    let returnUrl = 'https://sondri.ai/watch/';
    try {
      const body = (await request.json()) as { return_url?: string };
      if (body?.return_url) returnUrl = body.return_url;
    } catch {
      /* empty body is valid */
    }

    let stripeCustomerId = customerIdOrStripeId.startsWith('cus_') ? customerIdOrStripeId : '';
    if (!stripeCustomerId) {
      const customer = await getCustomerById(env, customerIdOrStripeId);
      stripeCustomerId = customer?.stripe_customer_id || '';
    }

    if (!stripeCustomerId) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'NO_STRIPE_CUSTOMER',
            message: 'Customer does not yet have an associated Stripe Customer ID.',
          },
        },
        { status: 404 }
      );
    }

    const stripe = getStripe(env);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return Response.json({
      success: true,
      data: {
        portal_url: portalSession.url,
        stripe_customer_id: stripeCustomerId,
      },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: err?.code || 'STRIPE_ERROR', message: err?.message || 'Unable to create portal session' } },
      { status: err?.statusCode || 500 }
    );
  }
}
