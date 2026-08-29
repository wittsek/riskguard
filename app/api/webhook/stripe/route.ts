import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/server';
import { isStripeWebhookConfigured } from '@/lib/stripe/env';
import {
  billingPatchFromStripeEvent,
  type StripeBillingEventObject,
} from '@/lib/stripe/tier';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isStripeWebhookConfigured() || !process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json({ error: 'Stripe webhook is not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  const rawBody = await request.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!.trim();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 });
  }

  const patch = billingPatchFromStripeEvent({
    type: event.type,
    data: { object: event.data.object as StripeBillingEventObject },
  });
  if (!patch) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is required to apply billing updates.' },
      { status: 503 },
    );
  }

  let userId = patch.userId;
  if (!userId && patch.customerId) {
    const { data } = await admin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', patch.customerId)
      .maybeSingle();
    userId = data?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ received: true, unmatched: true });
  }

  const update: { subscription_tier: 'pro' | 'free'; stripe_customer_id?: string } = {
    subscription_tier: patch.tier,
  };
  if (patch.customerId) update.stripe_customer_id = patch.customerId;

  const { error } = await admin.from('profiles').update(update).eq('id', userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true, tier: patch.tier });
}
