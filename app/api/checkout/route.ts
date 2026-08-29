import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  isStripeBillingConfigured,
  isStripeInterval,
  type StripeInterval,
} from '@/lib/stripe/env';
import { checkoutUrls, getStripe, resolveCheckoutPrice } from '@/lib/stripe/server';

export const dynamic = 'force-dynamic';

function parseInterval(body: unknown): StripeInterval | null {
  if (typeof body !== 'object' || body == null) return null;
  const interval = (body as { interval?: unknown }).interval;
  return isStripeInterval(interval) ? interval : null;
}

export async function POST(request: Request) {
  if (!isStripeBillingConfigured()) {
    return NextResponse.json({ error: 'Stripe Checkout is not configured.' }, { status: 503 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to subscribe.', login_url: '/register?next=/pricing' },
      { status: 401 },
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const interval = parseInterval(body) ?? 'monthly';
  const priceId = resolveCheckoutPrice(interval);
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price IDs are not configured.' }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, subscription_tier')
    .eq('id', user.id)
    .maybeSingle();

  try {
    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id?.trim() || null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      const admin = createAdminClient();
      if (admin) {
        await admin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      }
    }

    const urls = checkoutUrls();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: urls.success_url,
      cancel_url: urls.cancel_url,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a Checkout URL.' }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start Checkout.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
