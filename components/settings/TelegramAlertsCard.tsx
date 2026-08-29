'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';

export function TelegramAlertsCard() {
  const { user, loading, configured } = useAuth();
  const [chatId, setChatId] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    fetch('/api/profile/telegram')
      .then(async (res) => {
        const body = (await res.json()) as { telegram_chat_id?: string | null; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(body.error ?? 'Could not load Telegram settings.');
          return;
        }
        setChatId(body.telegram_chat_id ?? '');
      })
      .catch(() => {
        if (!cancelled) setError('Could not load Telegram settings.');
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/profile/telegram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_chat_id: chatId.trim() || null }),
      });
      const body = (await res.json()) as { telegram_chat_id?: string | null; error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Could not save chat ID.');
        return;
      }
      setChatId(body.telegram_chat_id ?? '');
      setMessage(
        body.telegram_chat_id
          ? 'Chat ID saved. The next saved audit sends one Telegram message.'
          : 'Alerts cleared. No Telegram message will be sent.',
      );
    } catch {
      setError('Could not save chat ID.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram alerts</CardTitle>
        <CardDescription>
          Optional and off by default. One message per saved audit — readiness, leak, top habit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {loading || !loaded ? (
          <p className="text-zinc-500">Loading alerts…</p>
        ) : !user ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-zinc-400">Sign in to enable alerts.</p>
            {configured ? (
              <Button asChild size="sm">
                <Link href="/login">Login</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onSave} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-zinc-400">Chat ID</span>
              <Input
                value={chatId}
                onChange={(event) => setChatId(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 123456789"
                aria-label="Telegram chat ID"
              />
            </label>
            <ol className="list-decimal space-y-1 pl-5 text-zinc-500">
              <li>Message your RiskGuard bot with /start (or use @userinfobot).</li>
              <li>Paste the numeric chat ID here and save.</li>
              <li>Leave blank and save to turn alerts off.</li>
            </ol>
            <p className="text-xs text-zinc-600">
              Server needs <code className="text-zinc-400">TELEGRAM_BOT_TOKEN</code>. Without it, saves
              stay quiet. Webhook URL: <code className="text-zinc-400">/api/webhook/telegram</code>.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving…' : 'Save chat ID'}
              </Button>
              {chatId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => setChatId('')}
                >
                  Clear
                </Button>
              ) : null}
            </div>
            {message ? <p className="text-emerald-400">{message}</p> : null}
            {error ? <p className="text-red-400">{error}</p> : null}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
