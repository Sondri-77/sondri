import { Env } from './types';
import { handleCreateCustomer, handleGetCustomer } from './routes/customers';
import { handleCreateSubscription } from './routes/subscriptions';
import { handleCreateCharge } from './routes/charges';
import { handleCreateInvoice, handleListInvoices } from './routes/invoices';
import { handleStripeWebhook } from './routes/webhooks';
import { handleCreateCheckoutSession } from './routes/checkout';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

function withCors(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    // 0. Handle CORS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // 1. Webhook Route (No X-API-Key required, verified by Stripe-Signature)
    if (path === '/webhooks/stripe' && method === 'POST') {
      return handleStripeWebhook(request, env);
    }

    // 2. Public Website Checkout Route (No X-API-Key required)
    if (path === '/create-checkout-session' && method === 'POST') {
      const resp = await handleCreateCheckoutSession(request, env);
      return withCors(resp);
    }

    // 3. Authentication Check for Admin API Endpoints
    const apiKeyHeader = request.headers.get('X-API-Key');
    if (!apiKeyHeader || apiKeyHeader !== env.API_KEY) {
      return withCors(
        Response.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing X-API-Key header' } },
          { status: 401 }
        )
      );
    }


    let response: Response;

    // 3. API Router
    // POST /customers
    if (path === '/customers' && method === 'POST') {
      response = await handleCreateCustomer(request, env);
    } else {
      // Match /customers/:id and its sub-resources
      const customerMatch = path.match(/^\/customers\/([^\/]+)(\/.*)?$/);

      if (customerMatch) {
        const customerId = customerMatch[1];
        const subPath = customerMatch[2] || '';

        // GET /customers/:id
        if (subPath === '' && method === 'GET') {
          response = await handleGetCustomer(customerId, env);
        }
        // POST /customers/:id/subscription
        else if (subPath === '/subscription' && method === 'POST') {
          response = await handleCreateSubscription(customerId, request, env);
        }
        // POST /customers/:id/charges
        else if (subPath === '/charges' && method === 'POST') {
          response = await handleCreateCharge(customerId, request, env);
        }
        // POST /customers/:id/invoices
        else if (subPath === '/invoices' && method === 'POST') {
          response = await handleCreateInvoice(customerId, env);
        }
        // GET /customers/:id/invoices
        else if (subPath === '/invoices' && method === 'GET') {
          response = await handleListInvoices(customerId, env);
        } else {
          response = Response.json(
            { success: false, error: { code: 'NOT_FOUND', message: `Route not found: ${method} ${path}` } },
            { status: 404 }
          );
        }
      } else {
        response = Response.json(
          { success: false, error: { code: 'NOT_FOUND', message: `Route not found: ${method} ${path}` } },
          { status: 404 }
        );
      }
    }

    return withCors(response);
  },
};

