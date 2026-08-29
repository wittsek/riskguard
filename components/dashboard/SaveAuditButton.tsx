'use client';

import Link from 'next/link';
import { UpgradeLink } from '@/components/billing/BillingButtons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { useAuditSession } from '@/lib/store/audit-session';
import { isStripePublishableConfigured } from '@/lib/stripe/env';

export function SaveAuditButton() {
  const { user, isPro } = useAuth();
  const { session, persistStatus, persistError, saveToAccount } = useAuditSession();
  const hostedPaywall = isStripePublishableConfigured();

  if (!session) return null;

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link href="/login">Sign in to save</Link>
      </Button>
    );
  }

  if (hostedPaywall && !isPro) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <UpgradeLink label="Upgrade to Pro to save" />
        {persistError ? <p className="text-sm text-rose-400">{persistError}</p> : null}
      </div>
    );
  }

  if (persistStatus === 'saving') {
    return <p className="text-sm text-zinc-400">Saving to your account…</p>;
  }

  if (persistStatus === 'saved' || session.savedReportId) {
    return <p className="text-sm text-emerald-400">Saved to your account</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => void saveToAccount()}>
        Save to my account
      </Button>
      {persistError ? <p className="text-sm text-rose-400">{persistError}</p> : null}
    </div>
  );
}
