import { NextResponse } from 'next/server';
import { generateCoaching, hasLlmApiKey, parseCoachRequest } from '@/lib/ai';
import { hostedProGate } from '@/lib/billing';
import { isStripeBillingConfigured } from '@/lib/stripe/env';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = parseCoachRequest(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const hostedLlm = hasLlmApiKey() && isStripeBillingConfigured();
  if (hostedLlm && isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        try {
          const coaching = await generateCoaching(parsed, { forceRuleBased: true });
          return NextResponse.json(coaching);
        } catch {
          return NextResponse.json({ error: 'Could not generate coaching notes.' }, { status: 500 });
        }
      }
      const gate = await hostedProGate(supabase, user.id);
      if (gate) return gate;
    }
  }

  try {
    const coaching = await generateCoaching(parsed);
    return NextResponse.json(coaching);
  } catch {
    return NextResponse.json({ error: 'Could not generate coaching notes.' }, { status: 500 });
  }
}
