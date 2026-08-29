import { NextResponse } from 'next/server';
import { normalizeTelegramChatId } from '@/lib/telegram';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function requireUser() {
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 }) };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { error: NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 }) };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Sign in to enable alerts.' }, { status: 401 }) };
  }
  return { supabase, user };
}

export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from('profiles')
    .select('telegram_chat_id')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ telegram_chat_id: data?.telegram_chat_id ?? null });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const raw =
    typeof body === 'object' && body != null && 'telegram_chat_id' in body
      ? (body as { telegram_chat_id: unknown }).telegram_chat_id
      : undefined;
  const parsed = normalizeTelegramChatId(raw ?? '');
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { error } = await auth.supabase.from('profiles').upsert(
    { id: auth.user.id, telegram_chat_id: parsed.value },
    { onConflict: 'id' },
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ telegram_chat_id: parsed.value });
}
