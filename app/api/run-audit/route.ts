import { NextResponse } from 'next/server';
import { hostedProGate } from '@/lib/billing';
import { parseRunAuditAnnotations, parseRunAuditTrades } from '@/lib/persist/mapAuditToDb';
import { persistLintedAudit } from '@/lib/persist/persistAudit';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { notifySavedAudit } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured. Add keys to .env.local to save audits.' },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to save this audit.' }, { status: 401 });
  }

  const gate = await hostedProGate(supabase, user.id);
  if (gate) return gate;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = parseRunAuditTrades(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const annotations = parseRunAuditAnnotations(body);

  try {
    const saved = await persistLintedAudit(supabase, user, parsed, annotations);
    await notifySavedAudit(supabase, user.id, saved);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save audit.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
