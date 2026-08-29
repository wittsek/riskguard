import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isStripeBillingConfigured } from '@/lib/stripe/env';
import type { Database, SubscriptionTier } from '@/types';
import { isPro, proRequiredBody } from './pro';

type Client = SupabaseClient<Database>;

export async function getSubscriptionTier(
  supabase: Client,
  userId: string,
): Promise<SubscriptionTier | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.subscription_tier;
}

/** On the hosted site (Stripe configured), persist / latest / managed LLM need Pro. Self-host without Stripe is unchanged. */
export async function hostedProGate(
  supabase: Client,
  userId: string,
  env: Record<string, string | undefined> = process.env,
): Promise<NextResponse | null> {
  if (!isStripeBillingConfigured(env)) return null;
  const tier = await getSubscriptionTier(supabase, userId);
  if (isPro(tier)) return null;
  return NextResponse.json(proRequiredBody(), { status: 402 });
}
