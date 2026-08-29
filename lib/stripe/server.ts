import Stripe from 'stripe';
import { getStripePriceId, type StripeInterval } from './env';
import { checkoutUrls, portalReturnUrl } from './urls';

export { checkoutUrls, portalReturnUrl };

let stripeClient: Stripe | null = null;

export function getStripe(env: Record<string, string | undefined> = process.env): Stripe {
  const secret = env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not set.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secret);
  }
  return stripeClient;
}

export function resolveCheckoutPrice(
  interval: StripeInterval,
  env: Record<string, string | undefined> = process.env,
): string | null {
  return getStripePriceId(interval, env);
}
