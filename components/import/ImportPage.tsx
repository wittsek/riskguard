'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ExportCookbook } from '@/components/import/ExportCookbook';
import { ParseErrorPanel } from '@/components/import/ParseErrorPanel';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CsvDropzone } from '@/components/upload/CsvDropzone';
import { useAuditSession } from '@/lib/store/audit-session';

export function ImportPage() {
  const { session, error, runCsv, loadSample } = useAuditSession();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <MarketingHeader />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">CSV import</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Export cookbook for MT4 and MT5
          </h1>
          <p className="max-w-2xl text-zinc-400">
            One-click-feeling steps to a file our parser already accepts. Closed positions only —
            no broker auto-sync yet.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => loadSample()}>
              Load sample trades
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">
                Back to leak calculator <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Drop the CSV here</CardTitle>
            <CardDescription>
              Parsed in the browser. Guest-friendly — sign in only if you want to save a copy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CsvDropzone showGuide={false} onText={(text, name) => runCsv(text, name, 'upload')} />
            <ParseErrorPanel error={error} />
            {session ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-400">
                <p>
                  {session.fileName} · {session.result.metrics.total_trades} trades · {session.format}
                </p>
                <Button asChild variant="link" className="px-0">
                  <Link href="/">See the leak calculator</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <ExportCookbook />
      </div>
      <MarketingFooter />
    </main>
  );
}
