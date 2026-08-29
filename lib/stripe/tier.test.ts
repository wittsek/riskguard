import { describe, expect, it } from 'vitest';
import {
  billingPatchFromStripeEvent,
  subscriptionStatusToTier,
  type StripeBillingEvent,
} from './tier';

function event(type: string, object: StripeBillingEvent['data']['object']): StripeBillingEvent {
  return { type, data: { object } };
}

describe('subscriptionStatusToTier', () => {
  it('maps paying statuses to pro and everything else to free', () => {
    expect(subscriptionStatusToTier('active')).toBe('pro');
    expect(subscriptionStatusToTier('trialing')).toBe('pro');
    expect(subscriptionStatusToTier('past_due')).toBe('pro');
    expect(subscriptionStatusToTier('canceled')).toBe('free');
    expect(subscriptionStatusToTier('unpaid')).toBe('free');
    expect(subscriptionStatusToTier('incomplete')).toBe('free');
    expect(subscriptionStatusToTier('incomplete_expired')).toBe('free');
    expect(subscriptionStatusToTier('paused')).toBe('free');
    expect(subscriptionStatusToTier(null)).toBe('free');
  });
});

describe('billingPatchFromStripeEvent', () => {
  it('sets pro on subscription checkout.session.completed', () => {
    expect(
      billingPatchFromStripeEvent(
        event('checkout.session.completed', {
          mode: 'subscription',
          customer: 'cus_123',
          client_reference_id: 'user-1',
          metadata: { user_id: 'user-1' },
        }),
      ),
    ).toEqual({
      tier: 'pro',
      customerId: 'cus_123',
      userId: 'user-1',
    });
  });

  it('ignores non-subscription checkouts and unknown events', () => {
    expect(
      billingPatchFromStripeEvent(
        event('checkout.session.completed', { mode: 'payment', customer: 'cus_1' }),
      ),
    ).toBeNull();
    expect(billingPatchFromStripeEvent(event('invoice.paid', { customer: 'cus_1' }))).toBeNull();
  });

  it('maps customer.subscription.updated from status', () => {
    expect(
      billingPatchFromStripeEvent(
        event('customer.subscription.updated', {
          customer: 'cus_abc',
          status: 'active',
          metadata: { user_id: 'user-9' },
        }),
      ),
    ).toEqual({ tier: 'pro', customerId: 'cus_abc', userId: 'user-9' });

    expect(
      billingPatchFromStripeEvent(
        event('customer.subscription.updated', {
          customer: { id: 'cus_obj' },
          status: 'canceled',
        }),
      ),
    ).toEqual({ tier: 'free', customerId: 'cus_obj', userId: null });
  });

  it('sets free on customer.subscription.deleted', () => {
    expect(
      billingPatchFromStripeEvent(
        event('customer.subscription.deleted', {
          customer: 'cus_gone',
          status: 'canceled',
        }),
      ),
    ).toEqual({ tier: 'free', customerId: 'cus_gone', userId: null });
  });
});
