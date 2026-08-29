'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AuditToolbar } from '@/components/dashboard/AuditToolbar';
import { EmptyAuditState } from '@/components/dashboard/EmptyAuditState';
import { ViolationBadge } from '@/components/dashboard/ViolationBadge';
import { SetupTagChips } from '@/components/trades/SetupTagChips';
import { TradeNoteField } from '@/components/trades/TradeNoteField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuditSession } from '@/lib/store/audit-session';
import { useTradeAnnotations } from '@/lib/store/trade-annotations';
import {
  type AnnotationFilter,
  type AnnotationSort,
  SETUP_TAG_PRESETS,
  applyAnnotationView,
  usedSetupTags,
} from '@/lib/trades/annotations';
import { cn, formatMoney } from '@/lib/utils';

const SORT_OPTIONS: { value: AnnotationSort; label: string }[] = [
  { value: 'original', label: 'Book order' },
  { value: 'open_time', label: 'Open time' },
  { value: 'tag', label: 'Setup tag' },
  { value: 'has_note', label: 'Has note' },
];

function filterLabel(filter: AnnotationFilter): string {
  if (filter === 'all') return 'All';
  if (filter === 'has_note') return 'Has note';
  if (filter === 'no_note') return 'No note';
  return filter.tag;
}

function sameFilter(a: AnnotationFilter, b: AnnotationFilter): boolean {
  if (a === b) return true;
  return typeof a === 'object' && typeof b === 'object' && a.tag.toLowerCase() === b.tag.toLowerCase();
}

export default function TradesPage() {
  const { session, hydrated } = useAuditSession();
  const { map, setAnnotation } = useTradeAnnotations();
  const [filter, setFilter] = useState<AnnotationFilter>('all');
  const [sort, setSort] = useState<AnnotationSort>('original');

  const rows = useMemo(
    () => (session ? applyAnnotationView(session.result.annotated_trades, map, filter, sort) : []),
    [session, map, filter, sort],
  );
  const allAnnotated = useMemo(
    () => (session ? applyAnnotationView(session.result.annotated_trades, map) : []),
    [session, map],
  );
  const tagFilters = useMemo(() => {
    const used = usedSetupTags(allAnnotated);
    const extras = used.filter(
      (tag) => !SETUP_TAG_PRESETS.some((preset) => preset.toLowerCase() === tag.toLowerCase()),
    );
    return [...SETUP_TAG_PRESETS, ...extras];
  }, [allAnnotated]);

  if (!hydrated) return <p className="text-sm text-zinc-500">Loading session…</p>;
  if (!session) return <EmptyAuditState title="Trade log" />;

  const total = session.result.annotated_trades.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trade log</h1>
        <p className="text-sm text-zinc-500">
          Closed tickets with violation tags. Add a setup chip and a one-line note on the same row.
        </p>
      </div>

      <AuditToolbar />

      <Card className="overflow-hidden">
        <CardHeader className="space-y-4">
          <CardTitle>
            {rows.length === total ? `${total} trades` : `${rows.length} of ${total} trades`}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">Filter</span>
            {(
              [
                { id: 'all' as const, label: 'All' },
                { id: 'has_note' as const, label: 'Has note' },
                { id: 'no_note' as const, label: 'No note' },
              ] as const
            ).map((item) => (
              <FilterChip
                key={item.id}
                active={sameFilter(filter, item.id)}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </FilterChip>
            ))}
            {tagFilters.map((tag) => (
              <FilterChip
                key={tag}
                active={sameFilter(filter, { tag })}
                onClick={() => setFilter({ tag })}
              >
                {tag}
              </FilterChip>
            ))}
            <label className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as AnnotationSort)}
                className="h-8 rounded-md border border-white/15 bg-black/40 px-2 text-xs text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/60"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-y border-white/10 bg-white/5 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium">Side</th>
                <th className="px-4 py-3 font-medium">Lots</th>
                <th className="px-4 py-3 font-medium">Open</th>
                <th className="px-4 py-3 font-medium">Actual</th>
                <th className="px-4 py-3 font-medium">Disciplined</th>
                <th className="px-4 py-3 font-medium">Flags</th>
                <th className="px-4 py-3 font-medium">Setup</th>
                <th className="min-w-[12rem] px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No trades match {filterLabel(filter)}.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={`${row.key}-${index}`} className="border-b border-white/5 align-top">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {row.trade.ticket_id ?? '—'}
                    </td>
                    <td className="px-4 py-3">{row.trade.symbol}</td>
                    <td className="px-4 py-3 text-zinc-400">{row.trade.trade_type}</td>
                    <td className="px-4 py-3">{row.trade.lot_size}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {row.trade.open_time.replace('T', ' ').replace('.000Z', ' UTC')}
                    </td>
                    <td
                      className={
                        row.trade.pnl < 0 ? 'px-4 py-3 text-rose-300' : 'px-4 py-3 text-emerald-300'
                      }
                    >
                      {formatMoney(row.trade.pnl)}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{formatMoney(row.trade.disciplined_pnl)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.trade.violations.length === 0 ? (
                          <span className="text-xs text-zinc-600">—</span>
                        ) : (
                          row.trade.violations.map((type) => <ViolationBadge key={type} type={type} />)
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SetupTagChips
                        tags={row.setup_tags}
                        onChange={(setup_tags) => setAnnotation(row.key, { setup_tags })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <TradeNoteField
                        value={row.note}
                        onCommit={(note) => setAnnotation(row.key, { note })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2 py-0.5 text-[11px]',
        active
          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
          : 'border-white/10 text-zinc-500 hover:text-zinc-200',
      )}
    >
      {children}
    </button>
  );
}
