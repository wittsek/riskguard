'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AiCoachNotes } from '@/components/dashboard/AiCoachNotes';
import { SaveAuditButton } from '@/components/dashboard/SaveAuditButton';
import { PropReadinessGauge } from '@/components/dashboard/PropReadinessGauge';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { ShareAuditButton } from '@/components/share/ShareAuditButton';
import { ParseErrorPanel } from '@/components/import/ParseErrorPanel';
import { CsvDropzone } from '@/components/upload/CsvDropzone';
import { SAMPLE_AUDIT_PATH } from '@/lib/pricing';
import { useAuditSession } from '@/lib/store/audit-session';
import { formatMoney } from '@/lib/utils';

export function LandingPage() {
  const { session, error, runCsv, loadSample } = useAuditSession();
  const result = session?.result;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <MarketingHeader />
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="space-y-5 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Portfolio risk</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">RiskGuard AI</h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            AI Trading &amp; Portfolio Auditor. Upload a broker CSV, see what revenge trades and
            missing stops actually cost you, and check prop-firm readiness.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard">
                Open dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" onClick={() => loadSample()}>
              Load sample trades
            </Button>
            <Button asChild variant="ghost">
              <Link href={SAMPLE_AUDIT_PATH}>View sample audit</Link>
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Free Leak Calculator</CardTitle>
            <CardDescription>
              Runs in the browser first. Defaults: $10,000 account, 5% daily / 10% total drawdown
              (FTMO-style). Sign in to keep the latest report.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CsvDropzone onText={(text, name) => runCsv(text, name, 'upload')} />
            <ParseErrorPanel error={error} />

            {result ? (
              <div className="grid gap-6 border-t border-white/10 pt-6 md:grid-cols-[auto,1fr]">
                <PropReadinessGauge score={result.readiness_score} />
                <div className="grid gap-4 sm:grid-cols-3">
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
                  <div className="sm:col-span-3">
                    <AiCoachNotes
                      notes={session?.coaching}
                      loading={session?.coachingStatus === 'loading'}
                      variant="compact"
                    />
                  </div>
                  <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
                    <p>
                      {session?.fileName} · {result.metrics.total_trades} trades ·{' '}
                      {session?.format}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <ShareAuditButton variant="compact" />
                      <SaveAuditButton />
                      <Button asChild variant="link" className="px-0">
                        <Link href="/dashboard">See full audit on the dashboard</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Drop a file or load the sample book to score readiness and leak cost.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <MarketingFooter />
    </main>
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
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={
          tone === 'rose'
            ? 'mt-1 text-2xl font-semibold text-rose-300'
            : tone === 'emerald'
              ? 'mt-1 text-2xl font-semibold text-emerald-300'
              : 'mt-1 text-2xl font-semibold'
        }
      >
        {value}
      </p>
    </div>
  );
}
