export const STRIPE_INTERVALS = ['monthly', 'yearly'] as const;
export type StripeInterval = (typeof STRIPE_INTERVALS)[number];

export type StripeEnv = Record<string, string | undefined>;

export function getStripePriceEnv(env: StripeEnv = process.env): {
  monthly: string | null;
  yearly: string | null;
} {
  return {
    monthly: env.STRIPE_PRICE_MONTHLY?.trim() || null,
    yearly: env.STRIPE_PRICE_YEARLY?.trim() || null,
  };
}

export function hasStripePriceEnv(env: StripeEnv = process.env): boolean {
  const { monthly, yearly } = getStripePriceEnv(env);
  return Boolean(monthly && yearly);
}

export function isStripeInterval(value: unknown): value is StripeInterval {
  return value === 'monthly' || value === 'yearly';
}

export function getStripePriceId(
  interval: StripeInterval,
  env: StripeEnv = process.env,
): string | null {
  const prices = getStripePriceEnv(env);
  return interval === 'monthly' ? prices.monthly : prices.yearly;
}

/** Server Checkout / Portal — secret + both price IDs. */
export function isStripeBillingConfigured(env: StripeEnv = process.env): boolean {
  return Boolean(env.STRIPE_SECRET_KEY?.trim() && hasStripePriceEnv(env));
}

export function isStripeWebhookConfigured(env: StripeEnv = process.env): boolean {
  return Boolean(env.STRIPE_WEBHOOK_SECRET?.trim());
}

/** Client signal that hosted Checkout is wired. Never include the secret here. */
export function isStripePublishableConfigured(env: StripeEnv = process.env): boolean {
  return Boolean(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
}
