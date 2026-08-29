import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';
import { getSupabaseEnv } from './env';

export function getServiceRoleKey(
  env: Record<string, string | undefined> = process.env,
): string | null {
  return env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

/** Server-only. Bypasses RLS so the Stripe webhook can write billing columns. */
export function createAdminClient(env: Record<string, string | undefined> = process.env) {
  const publicEnv = getSupabaseEnv();
  const serviceRole = getServiceRoleKey(env);
  if (!publicEnv || !serviceRole) return null;

  return createClient<Database>(publicEnv.url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
