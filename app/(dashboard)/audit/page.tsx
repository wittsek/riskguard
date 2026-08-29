'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionWinRateChart, SessionWinRateLegend } from '@/components/charts/SessionWinRateChart';
import { AiCoachNotes } from '@/components/dashboard/AiCoachNotes';
import { AuditToolbar } from '@/components/dashboard/AuditToolbar';
import { EmptyAuditState } from '@/components/dashboard/EmptyAuditState';
import { HabitLeakCards } from '@/components/dashboard/HabitLeakCards';
import { ViolationBadge } from '@/components/dashboard/ViolationBadge';
import { SessionReviewPanel } from '@/components/review/SessionReviewPanel';
import { ShareAuditButton } from '@/components/share/ShareAuditButton';
import { useAuditSession } from '@/lib/store/audit-session';
import { formatMoney } from '@/lib/utils';

export default function AuditPage() {
  const { session, hydrated } = useAuditSession();

  if (!hydrated) return <p className="text-sm text-zinc-500">Loading session…</p>;
  if (!session) {
    return (
      <div className="space-y-6">
        <EmptyAuditState title="Behavioral audit" />
        <Card>
          <CardHeader>
            <CardTitle>Share / Export card</CardTitle>
            <CardDescription>
              Load sample trades or upload a CSV to generate a shareable leak card.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShareAuditButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { result } = session;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Behavioral leak breakdown</h1>
          <p className="text-sm text-zinc-500">
            Each flagged ticket and the dollar gap versus a disciplined book.
          </p>
        </div>
        <ShareAuditButton />
      </div>

      <AuditToolbar />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Readiness</CardDescription>
            <CardTitle>{result.readiness_score}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Violations</CardDescription>
            <CardTitle>{result.violations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Money lost to mistakes</CardDescription>
            <CardTitle className="text-rose-300">{formatMoney(result.money_lost_to_mistakes)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <AiCoachNotes
        notes={session.coaching}
        loading={session.coachingStatus === 'loading'}
        variant="full"
      />

      <SessionReviewPanel result={result} coaching={session.coaching} />

      <HabitLeakCards habits={result.top_destructive_habits} />

      <Card>
        <CardHeader>
          <CardTitle>Session fatigue</CardTitle>
          <CardDescription>Win rate and PnL by UTC session.</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionWinRateChart sessions={result.sessions} />
          <SessionWinRateLegend sessions={result.sessions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Violation log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.violations.length === 0 ? (
            <p className="text-sm text-zinc-400">No rule breaks on this file.</p>
          ) : (
            result.violations.map((violation, index) => (
              <div
                key={`${violation.ticket_id}-${violation.type}-${index}`}
                className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ViolationBadge type={violation.type} />
                    <span className="text-sm text-zinc-300">
                      {violation.symbol} · {violation.ticket_id}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{violation.message}</p>
                </div>
                <p className="text-sm text-rose-300">{formatMoney(violation.pnl_impact)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
