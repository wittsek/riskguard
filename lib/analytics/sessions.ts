import type { LintableTrade, SessionName, SessionStats } from '@/types';
import { utcHour } from './tradeUtils';

export const SESSION_DEFS: ReadonlyArray<{
  session: SessionName;
  label: string;
}> = [
  { session: 'asian', label: 'Asian' },
  { session: 'london', label: 'London' },
  { session: 'new_york', label: 'New York' },
  { session: 'off_hours', label: 'Off-hours' },
];

/**
 * Mutually exclusive UTC buckets from the trade open hour:
 * Asian 00–08, London 08–13, New York 13–22, Off-hours 22–24.
 */
export function sessionForOpenTime(openTime: string): SessionName {
  const hour = utcHour(openTime);
  if (hour < 8) return 'asian';
  if (hour < 13) return 'london';
  if (hour < 22) return 'new_york';
  return 'off_hours';
}

export function computeSessionStats(trades: readonly LintableTrade[]): SessionStats[] {
  const buckets = new Map<SessionName, LintableTrade[]>();
  for (const def of SESSION_DEFS) buckets.set(def.session, []);
  for (const trade of trades) {
    buckets.get(sessionForOpenTime(trade.open_time))!.push(trade);
  }

  return SESSION_DEFS.map((def) => {
    const list = buckets.get(def.session) ?? [];
    const wins = list.filter((t) => t.pnl > 0).length;
    const losses = list.filter((t) => t.pnl < 0).length;
    const pnl = list.reduce((sum, t) => sum + t.pnl, 0);
    return {
      session: def.session,
      label: def.label,
      trades: list.length,
      wins,
      losses,
      win_rate: list.length === 0 ? 0 : wins / list.length,
      pnl,
    };
  });
}
