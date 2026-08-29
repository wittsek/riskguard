import type { Metadata } from 'next';
import { PricingPage } from '@/components/pricing/PricingPage';
import { SITE_DOMAIN } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Pricing | RiskGuard AI',
  description: `Free leak calculator forever. Pro is $19/month or $149/year with a 14-day money-back guarantee. Academy coming soon. ${SITE_DOMAIN}`,
};

export default function PricingRoute() {
  return <PricingPage />;
}
