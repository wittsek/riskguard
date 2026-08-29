import type { Metadata } from 'next';
import { SampleAuditView } from '@/components/sample/SampleAuditView';
import { buildSampleAudit } from '@/lib/sample/buildSampleAudit';

export const metadata: Metadata = {
  title: 'Sample audit | RiskGuard AI',
  description:
    'Public sample behavioral leak audit — readiness, leak dollars, dual equity, habits, and rule-based coach. No sign-up required.',
};

export default function ExampleAuditPage() {
  const sample = buildSampleAudit();
  return <SampleAuditView sample={sample} />;
}
