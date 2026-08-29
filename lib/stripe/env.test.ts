import { describe, expect, it } from 'vitest';
import { checkoutUrls, portalReturnUrl } from './urls';
import {
  getStripePriceEnv,
  getStripePriceId,
  hasStripePriceEnv,
  isStripeBillingConfigured,
  isStripeInterval,
  isStripePublishableConfigured,
  isStripeWebhookConfigured,
} from './env';

const prices = {
  STRIPE_PRICE_MONTHLY: 'price_monthly_test',
  STRIPE_PRICE_YEARLY: 'price_yearly_test',
};

describe('Stripe price env', () => {
  it('requires both monthly and yearly price IDs', () => {
    expect(hasStripePriceEnv({})).toBe(false);
    expect(hasStripePriceEnv({ STRIPE_PRICE_MONTHLY: 'price_m' })).toBe(false);
    expect(hasStripePriceEnv({ STRIPE_PRICE_YEARLY: 'price_y' })).toBe(false);
    expect(hasStripePriceEnv(prices)).toBe(true);
    expect(getStripePriceEnv(prices)).toEqual({
      monthly: 'price_monthly_test',
      yearly: 'price_yearly_test',
    });
  });

  it('resolves a price id by interval', () => {
    expect(getStripePriceId('monthly', prices)).toBe('price_monthly_test');
    expect(getStripePriceId('yearly', prices)).toBe('price_yearly_test');
    expect(isStripeInterval('monthly')).toBe(true);
    expect(isStripeInterval('weekly')).toBe(false);
  });

  it('treats Checkout as configured only with secret + both prices', () => {
    expect(isStripeBillingConfigured(prices)).toBe(false);
    expect(
      isStripeBillingConfigured({
        ...prices,
        STRIPE_SECRET_KEY: 'sk_test_xxx',
      }),
    ).toBe(true);
    expect(
      isStripeBillingConfigured({
        STRIPE_SECRET_KEY: 'sk_test_xxx',
        STRIPE_PRICE_MONTHLY: 'price_m',
      }),
    ).toBe(false);
  });

  it('keeps webhook and publishable flags separate from the secret', () => {
    expect(isStripeWebhookConfigured({})).toBe(false);
    expect(isStripeWebhookConfigured({ STRIPE_WEBHOOK_SECRET: 'whsec_test' })).toBe(true);
    expect(isStripePublishableConfigured({})).toBe(false);
    expect(
      isStripePublishableConfigured({ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_xxx' }),
    ).toBe(true);
  });
});

describe('checkout return URLs', () => {
  it('uses NEXT_PUBLIC_SITE_URL and never hard-codes localhost', () => {
    expect(checkoutUrls({ NEXT_PUBLIC_SITE_URL: 'https://getriskguard.com/' })).toEqual({
      success_url: 'https://getriskguard.com/dashboard?upgraded=1',
      cancel_url: 'https://getriskguard.com/pricing',
    });
    expect(portalReturnUrl({ NEXT_PUBLIC_SITE_URL: 'https://getriskguard.com' })).toBe(
      'https://getriskguard.com/settings',
    );
    expect(checkoutUrls({}).success_url).toBe('https://getriskguard.com/dashboard?upgraded=1');
  });
});
