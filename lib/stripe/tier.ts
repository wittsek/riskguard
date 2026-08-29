import type { SubscriptionTier } from '@/types';

/** Paying (or retrying) subscription statuses map to Cloud Pro. */
const PRO_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function subscriptionStatusToTier(
  status: string | null | undefined,
): Extract<SubscriptionTier, 'pro' | 'free'> {
  if (status && PRO_SUBSCRIPTION_STATUSES.has(status)) return 'pro';
  return 'free';
}

export const STRIPE_BILLING_EVENT_TYPES = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
] as const;

export type StripeBillingEventType = (typeof STRIPE_BILLING_EVENT_TYPES)[number];

export function isStripeBillingEventType(type: string): type is StripeBillingEventType {
  return (STRIPE_BILLING_EVENT_TYPES as readonly string[]).includes(type);
}

export type StripeBillingEventObject = {
  object?: string;
  customer?: string | { id?: string } | null;
  client_reference_id?: string | null;
  metadata?: Record<string, string | undefined> | null;
  status?: string | null;
  mode?: string | null;
};

export type StripeBillingEvent = {
  type: string;
  data: { object: StripeBillingEventObject };
};

export type StripeBillingPatch = {
  tier: Extract<SubscriptionTier, 'pro' | 'free'>;
  customerId: string | null;
  userId: string | null;
};

function stringId(value: string | { id?: string } | null | undefined): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (value && typeof value === 'object' && typeof value.id === 'string') {
    const trimmed = value.id.trim();
    return trimmed || null;
  }
  return null;
}

export function customerIdFromStripeEvent(event: StripeBillingEvent): string | null {
  return stringId(event.data.object.customer);
}

export function userIdFromStripeEvent(event: StripeBillingEvent): string | null {
  const fromMeta = event.data.object.metadata?.user_id?.trim();
  if (fromMeta) return fromMeta;
  const fromRef = event.data.object.client_reference_id?.trim();
  return fromRef || null;
}

/**
 * Pure mapping: Stripe event → profile billing patch.
 * Returns null for events we do not handle (ignore, 200).
 */
export function billingPatchFromStripeEvent(event: StripeBillingEvent): StripeBillingPatch | null {
  if (!isStripeBillingEventType(event.type)) return null;

  const customerId = customerIdFromStripeEvent(event);
  const userId = userIdFromStripeEvent(event);

  if (event.type === 'checkout.session.completed') {
    const mode = event.data.object.mode;
    if (mode && mode !== 'subscription') return null;
    return { tier: 'pro', customerId, userId };
  }

  if (event.type === 'customer.subscription.deleted') {
    return { tier: 'free', customerId, userId };
  }

  return {
    tier: subscriptionStatusToTier(event.data.object.status),
    customerId,
    userId,
  };
}
