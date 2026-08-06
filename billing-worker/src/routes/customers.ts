import { getStripe } from '../lib/stripe';
import { Env, CreateCustomerDTO } from '../types';

export async function handleCreateCustomer(request: Request, env: Env): Promise<Response> {
  try {
    const body: CreateCustomerDTO = await request.json();
    
    if (!body.email || !body.name || !body.client_id) {
      return Response.json(
        { success: false, error: { code: 'INVALID_BODY', message: 'Missing required fields: email, name, client_id' } },
        { status: 400 }
      );
    }

    const stripe = getStripe(env);

    // Create Customer with metadata
    const customer = await stripe.customers.create({
      name: body.name,
      email: body.email,
      metadata: {
        client_id: body.client_id,
        created_via: 'sondri_billing_worker',
      },
    });

    return Response.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        client_id: customer.metadata.client_id,
      },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: err.code || 'STRIPE_ERROR', message: err.message } },
      { status: err.statusCode || 500 }
    );
  }
}

export async function handleGetCustomer(customerId: string, env: Env): Promise<Response> {
  try {
    const stripe = getStripe(env);
    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      return Response.json(
        { success: false, error: { code: 'CUSTOMER_DELETED', message: 'Customer has been deleted' } },
        { status: 404 }
      );
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });

    return Response.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          metadata: customer.metadata,
        },
        subscriptions: subscriptions.data.map((sub) => ({
          id: sub.id,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          items: sub.items.data.map((i) => ({
            id: i.id,
            price_id: i.price.id,
            unit_amount: i.price.unit_amount,
            currency: i.price.currency,
          })),
        })),
      },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: err.code || 'STRIPE_ERROR', message: err.message } },
      { status: err.statusCode || 500 }
    );
  }
}
