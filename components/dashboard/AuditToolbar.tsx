'use client';

import { ParseErrorPanel } from '@/components/import/ParseErrorPanel';
import { Button } from '@/components/ui/button';
import { CsvDropzone } from '@/components/upload/CsvDropzone';
import { useAuditSession } from '@/lib/store/audit-session';
import { SaveAuditButton } from './SaveAuditButton';

export function AuditToolbar() {
  const { session, error, runCsv, loadSample, clear } = useAuditSession();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => loadSample()}>Load sample trades</Button>
        {session ? (
          <Button variant="ghost" onClick={clear}>
            Clear
          </Button>
        ) : null}
        {session ? (
          <p className="text-sm text-zinc-500">
            {session.fileName} · {session.result.metrics.total_trades} trades · {session.format}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">No book loaded yet.</p>
        )}
      </div>
      <CsvDropzone onText={(text, name) => runCsv(text, name, 'upload')} />
      <ParseErrorPanel error={error} />
      <SaveAuditButton />
    </div>
  );
}
