'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UpgradeLink } from '@/components/billing/BillingButtons';
import { useAuth } from '@/lib/auth/auth-context';
import { isStripePublishableConfigured } from '@/lib/stripe/env';

export function AuthNav() {
  const { user, loading, signOut, isPro } = useAuth();
  const stripeLive = isStripePublishableConfigured();
  const router = useRouter();

  if (loading) {
    return <span className="text-xs text-zinc-600">…</span>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {stripeLive && !isPro ? <UpgradeLink /> : null}
        <Link
          href="/settings"
          className="hidden max-w-[180px] truncate text-xs text-zinc-400 sm:inline hover:text-white"
        >
          {user.email}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await signOut();
            router.refresh();
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/register">Register</Link>
      </Button>
    </div>
  );
}
