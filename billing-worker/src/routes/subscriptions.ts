import { getStripe } from '../lib/stripe';
import { Env, CreateSubscriptionDTO } from '../types';

export async function handleCreateSubscription(
  customerId: string,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body: CreateSubscriptionDTO = await request.json();

    if (!body.price_id) {
      return Response.json(
        { success: false, error: { code: 'INVALID_BODY', message: 'Missing required field: price_id' } },
        { status: 400 }
      );
    }

    const stripe = getStripe(env);

    // Create Subscription with Net 14 email invoicing terms
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: body.price_id }],
      collection_method: 'send_invoice',
      days_until_due: 14, // Net 14 terms
    });

    return Response.json({
      success: true,
      data: {
        id: subscription.id,
        customer_id: subscription.customer,
        status: subscription.status,
        collection_method: subscription.collection_method,
        days_until_due: subscription.days_until_due,
        latest_invoice_id: typeof subscription.latest_invoice === 'string' 
          ? subscription.latest_invoice 
          : subscription.latest_invoice?.id,
      },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: err.code || 'STRIPE_ERROR', message: err.message } },
      { status: err.statusCode || 500 }
    );
  }
}
