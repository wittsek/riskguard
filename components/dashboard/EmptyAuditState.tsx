'use client';

import { UpgradeLink } from '@/components/billing/BillingButtons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/auth-context';
import { isStripePublishableConfigured } from '@/lib/stripe/env';
import { useAuditSession } from '@/lib/store/audit-session';
import { AuditToolbar } from './AuditToolbar';

export function EmptyAuditState({ title }: { title: string }) {
  const { user, isPro } = useAuth();
  const { loadLatestSaved, persistError } = useAuditSession();
  const hostedPaywall = isStripePublishableConfigured();
  const canLoadCloud = Boolean(user && (!hostedPaywall || isPro));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Upload a broker CSV or load the sample book. Guests keep results in this tab. Cloud Pro
          reloads the last saved report.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canLoadCloud ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => void loadLatestSaved()}>
              Load last saved report
            </Button>
            {persistError ? <p className="text-sm text-rose-400">{persistError}</p> : null}
          </div>
        ) : user && hostedPaywall && !isPro ? (
          <UpgradeLink label="Upgrade to Pro to load saved audits" />
        ) : null}
        <AuditToolbar />
      </CardContent>
    </Card>
  );
}
