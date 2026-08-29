import { SITE_DOMAIN } from '@/lib/pricing';

const PRODUCTION_ORIGIN = `https://${SITE_DOMAIN}`;

export function getPublicSiteOrigin(
  env: Record<string, string | undefined> = process.env,
): string {
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  return PRODUCTION_ORIGIN;
}

export function getAuthCallbackUrl(
  env: Record<string, string | undefined> = process.env,
  browserOrigin?: string,
): string {
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (configured) return `${configured}/auth/callback`;
  if (browserOrigin) return `${browserOrigin.replace(/\/$/, '')}/auth/callback`;
  return `${PRODUCTION_ORIGIN}/auth/callback`;
}
