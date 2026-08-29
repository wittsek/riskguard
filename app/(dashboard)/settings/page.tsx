'use client';

import Link from 'next/link';
import { ManageBillingButton, UpgradeLink } from '@/components/billing/BillingButtons';
import { TelegramAlertsCard } from '@/components/settings/TelegramAlertsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRICING_PATH } from '@/lib/pricing';
import { useAuth } from '@/lib/auth/auth-context';
import { isStripePublishableConfigured } from '@/lib/stripe/env';

export default function SettingsPage() {
  const { user, loading, configured, isPro, subscriptionTier } = useAuth();
  const stripeLive = isStripePublishableConfigured();

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading account…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500">Account and optional Telegram alerts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {configured
              ? 'Cloud Pro persists audits to your Imported account. The browser calculator stays free.'
              : 'Add Supabase keys to enable sign-in and saved history.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {user ? (
            <>
              <Row label="Email" value={user.email ?? '—'} />
              <Row
                label="Plan"
                value={isPro ? 'Cloud Pro' : (subscriptionTier ?? 'free')}
                href={PRICING_PATH}
                hrefLabel="See pricing"
              />
              {stripeLive ? (
                <div className="flex flex-wrap items-center gap-3">
                  {isPro ? <ManageBillingButton /> : <UpgradeLink />}
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-zinc-400">Sign in to manage a saved account.</p>
              <Button asChild size="sm">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <TelegramAlertsCard />
    </div>
  );
}

function Row({
  label,
  value,
  href,
  hrefLabel,
}: {
  label: string;
  value: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3">
      <span className="text-zinc-500">{label}</span>
      <span className="flex items-center gap-3 text-zinc-100">
        {value}
        {href ? (
          <Link href={href} className="text-xs text-emerald-400 hover:underline">
            {hrefLabel ?? href}
          </Link>
        ) : null}
      </span>
    </div>
  );
}
