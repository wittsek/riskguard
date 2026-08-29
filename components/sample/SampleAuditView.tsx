import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SessionWinRateChart, SessionWinRateLegend } from '@/components/charts/SessionWinRateChart';
import { DisciplineComparisonChart } from '@/components/charts/DisciplineComparisonChart';
import { AiCoachNotes } from '@/components/dashboard/AiCoachNotes';
import { HabitLeakCards } from '@/components/dashboard/HabitLeakCards';
import { PropReadinessGauge } from '@/components/dashboard/PropReadinessGauge';
import { ViolationBadge } from '@/components/dashboard/ViolationBadge';
import { MarketingShell } from '@/components/layout/MarketingShell';
import { AuditCardPreview } from '@/components/share/AuditCardPreview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRICING_PATH } from '@/lib/pricing';
import type { SampleAudit } from '@/lib/sample/buildSampleAudit';
import { formatMoney } from '@/lib/utils';

export function SampleAuditView({ sample }: { sample: SampleAudit }) {
  const { result, coaching, card, fileName, format } = sample;

  return (
    <MarketingShell>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">Sample</Badge>
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Public audit</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Sample behavioral leak audit
          </h1>
          <p className="max-w-2xl text-zinc-400">
            This is a sample. We pre-ran the bundled MT4 book through the same linter as a live
            upload — readiness, leak dollars, dual equity, habits, and the rule-based coach. No
            account and no API keys required.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/">
                Upload your CSV <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={PRICING_PATH}>See pricing</Link>
            </Button>
          </div>
          <p className="text-sm text-zinc-500">
            {fileName} · {result.metrics.total_trades} trades · {format}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[auto,1fr]">
          <Card className="flex items-center justify-center p-6">
            <PropReadinessGauge score={result.readiness_score} />
          </Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Readiness" value={String(result.readiness_score)} />
            <Stat label="Violations" value={String(result.violations.length)} />
            <Stat
              label="Money lost to mistakes"
              value={formatMoney(result.money_lost_to_mistakes)}
              tone="rose"
            />
            <Stat label="Actual PnL" value={formatMoney(result.actual_pnl)} />
            <Stat
              label="Disciplined PnL"
              value={formatMoney(result.disciplined_pnl)}
              tone="emerald"
            />
            <Stat label="Trades" value={String(result.metrics.total_trades)} />
          </div>
        </div>

        <AiCoachNotes notes={coaching} variant="full" />

        <Card>
          <CardHeader>
            <CardTitle>Actual vs disciplined equity</CardTitle>
            <CardDescription>
              Revenge trades are removed. No-SL losses are capped at 1% of the $10,000 starting
              balance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DisciplineComparisonChart points={result.equity_curve} />
          </CardContent>
        </Card>

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
            <CardDescription>Every flagged ticket on the sample book.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.violations.map((violation, index) => (
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
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Share card</CardTitle>
            <CardDescription>
              Same leak card traders export from a real audit — labeled from this sample book.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditCardPreview model={card} />
          </CardContent>
        </Card>

        <Card className="border-emerald-500/25 bg-emerald-500/5">
          <CardHeader>
            <CardTitle>This is a sample. Upload your CSV to audit your book.</CardTitle>
            <CardDescription>
              Free leak calculator on the landing page. Pro is for saved history and the GPT coach.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">Audit your trades</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Create a free account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'rose' | 'emerald';
}) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p
          className={
            tone === 'rose'
              ? 'text-xl font-semibold text-rose-300'
              : tone === 'emerald'
                ? 'text-xl font-semibold text-emerald-300'
                : 'text-xl font-semibold'
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
