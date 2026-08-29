'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DisciplineComparisonChart } from '@/components/charts/DisciplineComparisonChart';
import { SessionWinRateChart, SessionWinRateLegend } from '@/components/charts/SessionWinRateChart';
import { AiCoachNotes } from '@/components/dashboard/AiCoachNotes';
import { AuditToolbar } from '@/components/dashboard/AuditToolbar';
import { EmptyAuditState } from '@/components/dashboard/EmptyAuditState';
import { HabitLeakCards } from '@/components/dashboard/HabitLeakCards';
import { PropReadinessGauge } from '@/components/dashboard/PropReadinessGauge';
import { ShareAuditButton } from '@/components/share/ShareAuditButton';
import { useAuditSession } from '@/lib/store/audit-session';
import { formatMoney, formatPct } from '@/lib/utils';

export default function DashboardPage() {
  const { session, hydrated } = useAuditSession();

  if (!hydrated) {
    return <p className="text-sm text-zinc-500">Loading session…</p>;
  }

  if (!session) {
    return <EmptyAuditState title="Dashboard" />;
  }

  const { result } = session;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-zinc-500">
            Readiness, discipline curve, and the habits leaking the most money.
          </p>
        </div>
        <ShareAuditButton variant="compact" />
      </div>

      <AuditToolbar />

      <div className="grid gap-6 lg:grid-cols-[auto,1fr]">
        <Card className="flex items-center justify-center p-6">
          <PropReadinessGauge score={result.readiness_score} />
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStat label="Actual PnL" value={formatMoney(result.actual_pnl)} />
          <MiniStat label="Disciplined PnL" value={formatMoney(result.disciplined_pnl)} />
          <MiniStat label="Lost to mistakes" value={formatMoney(result.money_lost_to_mistakes)} />
          <MiniStat
            label="Daily DD"
            value={`${formatPct(result.drawdown.daily_drawdown_pct)} / ${formatPct(result.drawdown.daily_limit_pct, 0)}`}
          />
          <MiniStat
            label="Total DD"
            value={`${formatPct(result.drawdown.total_drawdown_pct)} / ${formatPct(result.drawdown.total_limit_pct, 0)}`}
          />
          <MiniStat
            label="Win rate"
            value={formatPct(result.metrics.win_rate * 100, 0)}
          />
        </div>
      </div>

      <AiCoachNotes
        notes={session.coaching}
        loading={session.coachingStatus === 'loading'}
        variant="preview"
      />

      <Card>
        <CardHeader>
          <CardTitle>Actual vs disciplined equity</CardTitle>
          <CardDescription>
            Revenge trades are removed. No-SL losses are capped at 1% of the $10,000 starting balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DisciplineComparisonChart points={result.equity_curve} />
        </CardContent>
      </Card>

      <HabitLeakCards habits={result.top_destructive_habits} />

      <Card>
        <CardHeader>
          <CardTitle>Session win rate</CardTitle>
          <CardDescription>UTC buckets: Asian 00–08, London 08–13, New York 13–22.</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionWinRateChart sessions={result.sessions} />
          <SessionWinRateLegend sessions={result.sessions} />
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
