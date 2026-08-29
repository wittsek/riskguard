import type { SubscriptionTier } from '@/types';

export const PRO_REQUIRED_CODE = 'pro_required' as const;
export const PRICING_HREF = '/pricing';

export function isPro(tier: SubscriptionTier | string | null | undefined): boolean {
  return tier === 'pro';
}

export function proRequiredBody() {
  return {
    error: 'Cloud Pro is required for this hosted feature.',
    code: PRO_REQUIRED_CODE,
    upgrade_url: PRICING_HREF,
  };
}
