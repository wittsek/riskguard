'use client';

import { SessionWinRateChart, SessionWinRateLegend } from '@/components/charts/SessionWinRateChart';
import { AiCoachNotes } from '@/components/dashboard/AiCoachNotes';
import { AuditToolbar } from '@/components/dashboard/AuditToolbar';
import { EmptyAuditState } from '@/components/dashboard/EmptyAuditState';
import { HabitLeakCards } from '@/components/dashboard/HabitLeakCards';
import { SessionReviewPanel } from '@/components/review/SessionReviewPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuditSession } from '@/lib/store/audit-session';

export default function ReviewPage() {
  const { session, hydrated } = useAuditSession();

  if (!hydrated) return <p className="text-sm text-zinc-500">Loading session…</p>;
  if (!session) {
    return <EmptyAuditState title="Session review" />;
  }

  const { result } = session;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Session review</h1>
        <p className="text-sm text-zinc-500">
          Post-session write-up from the linter. One review for the current book — not a daily diary.
        </p>
      </div>

      <AuditToolbar />

      <SessionReviewPanel result={result} coaching={session.coaching} variant="page" />

      <AiCoachNotes
        notes={session.coaching}
        loading={session.coachingStatus === 'loading'}
        variant="compact"
      />

      <HabitLeakCards habits={result.top_destructive_habits} />

      <Card>
        <CardHeader>
          <CardTitle>UTC sessions</CardTitle>
          <CardDescription>Asian 00–08 · London 08–13 · New York 13–22.</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionWinRateChart sessions={result.sessions} />
          <SessionWinRateLegend sessions={result.sessions} />
        </CardContent>
      </Card>
    </div>
  );
}
