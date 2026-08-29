import { NextResponse } from 'next/server';
import { loadLatestSavedAudit } from '@/lib/persist/persistAudit';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
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
    return NextResponse.json({ error: 'Sign in to load saved audits.' }, { status: 401 });
  }

  try {
    const latest = await loadLatestSavedAudit(supabase, user);
    if (!latest) {
      return NextResponse.json({ error: 'No saved audit yet.' }, { status: 404 });
    }
    return NextResponse.json(latest);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load saved audit.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
