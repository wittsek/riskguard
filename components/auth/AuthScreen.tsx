'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { getAuthCallbackUrl } from '@/lib/supabase/siteUrl';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';

type Mode = 'login' | 'register';

export function AuthScreen({ mode, authError }: { mode: Mode; authError?: string }) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(
    authError === 'auth' ? 'That login link expired or was invalid. Try again.' : null,
  );
  const [tone, setTone] = useState<'error' | 'ok'>('error');

  const title = mode === 'login' ? 'Sign in' : 'Create an account';
  const description =
    mode === 'login'
      ? 'Save audits to your account and pick them up after a refresh.'
      : 'Free to start. Upload a book, keep the leak report.';

  async function handlePassword(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: fullName.trim() ? { full_name: fullName.trim() } : undefined,
          emailRedirectTo: getAuthCallbackUrl(process.env, window.location.origin),
        },
      });
      if (error) throw error;
      if (data.session) {
        router.push('/dashboard');
        router.refresh();
        return;
      }
      setTone('ok');
      setMessage('Check your email to confirm the account, then sign in.');
    } catch (error) {
      setTone('error');
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink() {
    const supabase = createClient();
    if (!supabase) return;
    if (!email.trim()) {
      setTone('error');
      setMessage('Enter your email first.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: getAuthCallbackUrl(process.env, window.location.origin) },
      });
      if (error) throw error;
      setTone('ok');
      setMessage('Check your email for a login link.');
    } catch (error) {
      setTone('error');
      setMessage(error instanceof Error ? error.message : 'Could not send a login link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!configured ? (
          <SupabaseSetupMessage />
        ) : (
          <form className="space-y-4" onSubmit={handlePassword}>
            {mode === 'register' ? (
              <Field label="Name">
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  placeholder="Optional"
                />
              </Field>
            ) : null}
            <Field label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@firm.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="At least 6 characters"
              />
            </Field>
            {message ? (
              <p className={tone === 'ok' ? 'text-sm text-emerald-300' : 'text-sm text-rose-400'}>
                {message}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
            {mode === 'login' ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={handleMagicLink}
              >
                Email me a login link
              </Button>
            ) : null}
          </form>
        )}
        <p className="text-sm text-zinc-500">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <Link href="/register" className="text-emerald-400 hover:underline">
                Register
              </Link>
            </>
          ) : (
            <>
              Already registered?{' '}
              <Link href="/login" className="text-emerald-400 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
