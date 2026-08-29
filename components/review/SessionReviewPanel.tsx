'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildSessionReview } from '@/lib/review';
import {
  clearReviewDraft,
  readReviewDraft,
  writeReviewDraft,
} from '@/lib/store/session-review';
import { cn, formatMoney, formatWinRate } from '@/lib/utils';
import type { CoachingNotes, LintResult } from '@/types';

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function reviewFilename(label: string | undefined): string {
  const stamp = (label ?? 'book').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return `riskguard-session-review-${stamp || 'book'}.md`;
}

export function SessionReviewPanel({
  result,
  coaching,
  variant = 'embedded',
}: {
  result: LintResult;
  coaching?: CoachingNotes | null;
  variant?: 'embedded' | 'page';
}) {
  const model = useMemo(() => buildSessionReview(result, { coaching }), [result, coaching]);
  const [text, setText] = useState(model.write_up);
  const [edited, setEdited] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const writeUpRef = useRef(model.write_up);
  writeUpRef.current = model.write_up;

  useEffect(() => {
    const draft = readReviewDraft(model.fingerprint);
    if (draft) {
      setText(draft);
      setEdited(true);
    } else {
      setText(writeUpRef.current);
      setEdited(false);
    }
    setHydrated(true);
  }, [model.fingerprint]);

  useEffect(() => {
    if (!hydrated || edited) return;
    setText(model.write_up);
  }, [hydrated, edited, model.write_up]);

  useEffect(() => {
    if (!hydrated || !edited) return;
    const timer = window.setTimeout(() => writeReviewDraft(model.fingerprint, text), 300);
    return () => window.clearTimeout(timer);
  }, [text, edited, hydrated, model.fingerprint]);

  async function copyReview() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function resetAutoFill() {
    clearReviewDraft(model.fingerprint);
    setText(model.write_up);
    setEdited(false);
  }

  const weakest = model.weakest_session;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>{variant === 'page' ? 'Auto-filled write-up' : 'Session review'}</CardTitle>
            <CardDescription>
              Generated from the linter. Tweak the note — you are not starting from a blank page.
            </CardDescription>
          </div>
          {variant === 'embedded' ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/review">Open full review</Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Book"
            value={model.date_range ? model.date_range.label : '—'}
            hint={`${model.trade_count} trade${model.trade_count === 1 ? '' : 's'}`}
          />
          <Stat
            label="Weakest UTC session"
            value={weakest ? weakest.label : '—'}
            hint={
              weakest
                ? `${formatWinRate(weakest.win_rate)} · ${formatMoney(weakest.pnl)}`
                : 'No session trades'
            }
          />
          <Stat
            label="Revenge / missing SL"
            value={`${model.counts.revenge} / ${model.counts.missing_sl}`}
            hint={`${model.counts.other} other · ${model.counts.total} total`}
          />
          <Stat
            label="Leak $ / readiness"
            value={`$${Math.abs(model.leak_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })} leaked`}
            hint={`${model.readiness_score}/100 · disciplined ${formatMoney(model.disciplined_pnl)}`}
            tone="rose"
          />
        </div>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-wide text-zinc-500">Write-up</span>
          <textarea
            value={text}
            rows={variant === 'page' ? 22 : 16}
            spellCheck
            onChange={(event) => {
              setEdited(true);
              setText(event.target.value);
            }}
            className={cn(
              'w-full resize-y rounded-xl border border-white/15 bg-black/40 px-3 py-3 font-mono text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
            )}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void copyReview()}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadText(reviewFilename(model.date_range?.label), text)}
          >
            <Download className="h-4 w-4" />
            Download .md
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={resetAutoFill} disabled={!edited}>
            <RotateCcw className="h-4 w-4" />
            Reset to auto-fill
          </Button>
          <p className="text-xs text-zinc-500">
            {edited ? 'Edits saved in this tab.' : 'Auto-filled. Edits stay in this tab.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'rose';
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold', tone === 'rose' && 'text-rose-300')}>{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
