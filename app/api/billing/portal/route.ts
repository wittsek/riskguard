import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { isStripeBillingConfigured } from '@/lib/stripe/env';
import { getStripe, portalReturnUrl } from '@/lib/stripe/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!isStripeBillingConfigured()) {
    return NextResponse.json({ error: 'Stripe billing is not configured.' }, { status: 503 });
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
    return NextResponse.json({ error: 'Sign in to manage billing.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  const customerId = profile?.stripe_customer_id?.trim();
  if (!customerId) {
    return NextResponse.json(
      { error: 'No Stripe customer on this account yet. Subscribe first.', upgrade_url: '/pricing' },
      { status: 400 },
    );
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: portalReturnUrl(),
    });
    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a portal URL.' }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open the billing portal.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
