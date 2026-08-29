'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRICING_PATH } from '@/lib/pricing';
import { useAuth } from '@/lib/auth/auth-context';

export default function SettingsPage() {
  const { user, loading, configured } = useAuth();

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading account…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500">Account and upcoming alert channels.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {configured
              ? 'Signed-in audits persist to your Imported account.'
              : 'Add Supabase keys to enable sign-in and saved history.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {user ? (
            <>
              <Row label="Email" value={user.email ?? '—'} />
              <Row
                label="Plan"
                value="free"
                href={PRICING_PATH}
                hrefLabel="See pricing"
              />
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

      <Card>
        <CardHeader>
          <CardTitle>Telegram alerts</CardTitle>
          <CardDescription>Coming in a later slice. Chat ID will live on your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">
            Rule-break pings are not wired yet. The calculator and saved audits work without Telegram.
          </p>
        </CardContent>
      </Card>
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
