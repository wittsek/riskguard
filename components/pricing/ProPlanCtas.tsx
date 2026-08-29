'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckoutButton, ManageBillingButton } from '@/components/billing/BillingButtons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { withNextParam } from '@/lib/auth/safeNext';
import { PRO_MONTHLY_USD, PRO_YEARLY_USD } from '@/lib/pricing';
import { isStripeInterval, isStripePublishableConfigured } from '@/lib/stripe/env';

export function ProPlanCtas() {
  const { user, loading, isPro } = useAuth();
  const searchParams = useSearchParams();
  const checkout = searchParams.get('checkout');
  const started = useRef(false);
  const stripeLive = isStripePublishableConfigured();

  useEffect(() => {
    if (loading || !user || isPro || started.current) return;
    if (!isStripeInterval(checkout)) return;
    started.current = true;
    void fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: checkout }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { url?: string; error?: string };
        if (res.ok && data.url) window.location.href = data.url;
      })
      .catch(() => {
        started.current = false;
      });
  }, [checkout, isPro, loading, user]);

  if (!stripeLive) {
    return (
      <Button asChild className="w-full">
        <Link href={withNextParam('/register', '/pricing')}>Sign up for Pro</Link>
      </Button>
    );
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Checking account…</p>;
  }

  if (user && isPro) {
    return <ManageBillingButton className="w-full" variant="default" size="default" />;
  }

  if (!user) {
    return (
      <div className="space-y-2">
        <Button asChild className="w-full">
          <Link href={withNextParam('/register', '/pricing?checkout=monthly')}>
            Subscribe ${PRO_MONTHLY_USD}/month
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href={withNextParam('/register', '/pricing?checkout=yearly')}>
            Subscribe ${PRO_YEARLY_USD}/year
          </Link>
        </Button>
        <p className="text-center text-xs text-zinc-500">
          Create an account first — Checkout opens after you sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <CheckoutButton interval="monthly" label={`Subscribe $${PRO_MONTHLY_USD}/month`} />
      <CheckoutButton
        interval="yearly"
        label={`Subscribe $${PRO_YEARLY_USD}/year`}
        variant="outline"
      />
    </div>
  );
}
