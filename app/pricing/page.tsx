import type { Metadata } from 'next';
import { PricingPage } from '@/components/pricing/PricingPage';
import { SITE_DOMAIN } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Pricing | RiskGuard AI',
  description: `Community is the full AGPL linter, CSV, and Docker. Cloud Pro is $19/month or $149/year with AI in the bill and a 14-day refund. Academy waitlist only. ${SITE_DOMAIN}`,
};

export default function PricingRoute() {
  return <PricingPage />;
}
