import Stripe from 'stripe';
import { Env } from '../types';

export function getStripe(env: Env): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY secret is not set in Worker environment.');
  }

  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia' as any, // Current API version
    httpClient: Stripe.createFetchHttpClient(), // REQUIRED for Cloudflare Workers / Edge runtime
  });
}
