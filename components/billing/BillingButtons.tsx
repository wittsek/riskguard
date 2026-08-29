'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PRICING_PATH } from '@/lib/pricing';
import { isStripeInterval, type StripeInterval } from '@/lib/stripe/env';

async function postBilling(path: string, body?: unknown): Promise<string> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json()) as { url?: string; error?: string; login_url?: string };
  if (res.status === 401 && data.login_url) {
    window.location.href = data.login_url;
    return data.login_url;
  }
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? 'Billing request failed.');
  }
  window.location.href = data.url;
  return data.url;
}

export function CheckoutButton({
  interval,
  label,
  variant = 'default',
  className,
}: {
  interval: StripeInterval;
  label: string;
  variant?: 'default' | 'outline';
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        className={className ?? 'w-full'}
        disabled={busy}
        onClick={() => {
          if (!isStripeInterval(interval)) return;
          setBusy(true);
          setError(null);
          void postBilling('/api/checkout', { interval }).catch((err: unknown) => {
            setError(err instanceof Error ? err.message : 'Could not start Checkout.');
            setBusy(false);
          });
        }}
      >
        {busy ? 'Redirecting to Stripe…' : label}
      </Button>
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

export function ManageBillingButton({
  label = 'Manage billing',
  variant = 'outline',
  size = 'sm',
  className,
}: {
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default';
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError(null);
          void postBilling('/api/billing/portal').catch((err: unknown) => {
            setError(err instanceof Error ? err.message : 'Could not open the billing portal.');
            setBusy(false);
          });
        }}
      >
        {busy ? 'Opening portal…' : label}
      </Button>
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

export function UpgradeLink({ label = 'Upgrade to Pro' }: { label?: string }) {
  return (
    <Button asChild size="sm">
      <Link href={PRICING_PATH}>{label}</Link>
    </Button>
  );
}
