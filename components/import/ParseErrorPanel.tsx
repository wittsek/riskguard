import Link from 'next/link';
import type { ParseFailure } from '@/types';

export function ParseErrorPanel({ error }: { error: ParseFailure | string | null }) {
  if (!error) return null;

  if (typeof error === 'string') {
    return <p className="text-sm text-rose-400">{error}</p>;
  }

  return (
    <div className="space-y-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm">
      <p className="font-medium text-rose-200">{error.title}</p>
      <p className="text-rose-100/90">{error.message}</p>
      <p className="text-xs text-zinc-400">
        Format detected: <span className="text-zinc-200">{error.format}</span>
        {error.skipped > 0 ? ` · ${error.skipped} row(s) skipped` : null}
        {error.headers.length > 0 ? ` · headers: ${error.headers.slice(0, 8).join(', ')}` : null}
      </p>
      {error.rowErrors.length > 1 ? (
        <ul className="list-disc space-y-1 pl-5 text-xs text-rose-100/80">
          {error.rowErrors.slice(1, 4).map((row) => (
            <li key={`${row.row}-${row.message}`}>
              Row {row.row}: {row.message}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-zinc-300">{error.hint}</p>
      <Link href={error.guideHref} className="inline-flex text-emerald-400 underline-offset-4 hover:underline">
        Open the export cookbook
      </Link>
    </div>
  );
}
