import { getStripe } from '../lib/stripe';
import { Env, CreateChargeDTO } from '../types';

export async function handleCreateCharge(
  customerId: string,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body: CreateChargeDTO = await request.json();

    if (!body.amount || !body.description) {
      return Response.json(
        { success: false, error: { code: 'INVALID_BODY', message: 'Missing required fields: amount, description' } },
        { status: 400 }
      );
    }

    const stripe = getStripe(env);

    // Create InvoiceItem attached to the customer (accumulates silently until invoiced)
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: body.amount, // in cents (e.g. 50000 = $500.00)
      currency: body.currency || 'usd',
      description: body.description,
    });

    return Response.json({
      success: true,
      data: {
        id: invoiceItem.id,
        customer_id: invoiceItem.customer,
        amount: invoiceItem.amount,
        currency: invoiceItem.currency,
        description: invoiceItem.description,
        pending: true,
      },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: err.code || 'STRIPE_ERROR', message: err.message } },
      { status: err.statusCode || 500 }
    );
  }
}
