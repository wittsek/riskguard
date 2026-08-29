import { getPublicSiteOrigin } from '@/lib/supabase/siteUrl';

export function checkoutUrls(env: Record<string, string | undefined> = process.env): {
  success_url: string;
  cancel_url: string;
} {
  const origin = getPublicSiteOrigin(env);
  return {
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/pricing`,
  };
}

export function portalReturnUrl(env: Record<string, string | undefined> = process.env): string {
  return `${getPublicSiteOrigin(env)}/settings`;
}
