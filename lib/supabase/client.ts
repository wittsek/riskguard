import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types';
import { getSupabaseEnv } from './env';

export function createClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createBrowserClient<Database>(env.url, env.anonKey);
}
